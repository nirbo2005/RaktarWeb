import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma } from '@prisma/client';

const MAX_WEIGHT_PER_SHELF = 2000; 

@Injectable()
export class BatchService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notification: NotificationService,
    private events: EventsGateway,
  ) {}

  /**
   * Ellenőrzi a termék állapotát és riasztást küld lejárati idő vagy alacsony készlet esetén.
   */
  private async runHealthCheck(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
      include: { batches: true }
    });

    if (!product) return;

    const totalQty = product.batches.reduce((sum, b) => sum + b.mennyiseg, 0);
    
    
    if (totalQty < product.minimumKeszlet / 2) {
      await this.notification.createGlobalNotification(
        `KRITIKUS KÉSZLET: ${product.nev} mennyisége (${totalQty} db) a minimum készlet fele alá esett!`,
        'ALERT'
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const batch of product.batches) {
      if (!batch.lejarat) continue;
      const expiry = new Date(batch.lejarat);
      expiry.setHours(0, 0, 0, 0);
      
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      
      if (diffDays <= 0) {
        await this.notification.createGlobalNotification(
          `LEJÁRT TERMÉK: ${product.nev} (${batch.parcella}) lejárati ideje elérkezett vagy elmúlt!`,
          'ERROR'
        );
      } else if (diffDays <= 2) {
        await this.notification.createGlobalNotification(
          `KRITIKUS LEJÁRAT: ${product.nev} (${batch.parcella}) 2 napon belül lejár!`,
          'ALERT'
        );
      } else if (diffDays <= 7) {
        
        if (diffDays === 7) {
            await this.notification.createGlobalNotification(
              `LEJÁRAT FIGYELMEZTETÉS: ${product.nev} (${batch.parcella}) 1 hét múlva lejár!`,
              'INFO'
            );
        }
      }
    }
  }

  private async findAndMerge(
    productId: number, 
    parcella: string, 
    lejarat: any,
    additionalQty: number, 
    tx: Prisma.TransactionClient,
    excludeId?: number
  ) {
    const lejaratDate = (lejarat === "" || lejarat === undefined || lejarat === null) 
      ? null 
      : new Date(lejarat);

    const duplicate = await tx.batch.findFirst({
      where: {
        productId: Number(productId),
        parcella,
        lejarat: lejaratDate,
        id: excludeId ? { not: Number(excludeId) } : undefined,
      },
    });

    if (duplicate) {
      return await tx.batch.update({
        where: { id: duplicate.id },
        data: { mennyiseg: duplicate.mennyiseg + Number(additionalQty) },
      });
    }
    return null;
  }

  private async checkShelfCapacity(parcella: string, additionalWeight: number, excludeBatchId?: number) {
    const existingBatches = await this.prisma.batch.findMany({
      where: {
        parcella,
        id: excludeBatchId ? { not: Number(excludeBatchId) } : undefined
      },
      include: { product: true },
    });

    const currentWeight = existingBatches.reduce((total, batch) => total + (batch.mennyiseg * batch.product.suly), 0);

    if (currentWeight + additionalWeight > MAX_WEIGHT_PER_SHELF) {
      throw new BadRequestException(`Kapacitás túllépés! A(z) ${parcella} polc limitje ${MAX_WEIGHT_PER_SHELF} kg.`);
    }
  }

  async sortWarehouse(userId: number) {
    const allBatches = await this.prisma.batch.findMany({ include: { product: true } });
    const categories = [...new Set(allBatches.map(b => b.product.kategoria))];
    const sectors = ['A', 'B', 'C', 'D'];
    const categoryToSector: Record<string, string> = {};
    
    categories.forEach((cat, index) => {
      categoryToSector[cat] = sectors[Math.floor(index / 4)] || 'D';
    });

    await this.prisma.$transaction(async (tx) => {
      for (const batch of allBatches) {
        const targetSector = categoryToSector[batch.product.kategoria];
        let placed = false;
        for (let s = 1; s <= 5; s++) {
          for (let o = 1; o <= 4; o++) {
            const targetParcella = `${targetSector}${s}-${o}`;
            try {
              const merged = await this.findAndMerge(batch.productId, targetParcella, batch.lejarat, batch.mennyiseg, tx, batch.id);
              if (merged) {
                await tx.batch.delete({ where: { id: batch.id } });
              } else {
                await tx.batch.update({ where: { id: batch.id }, data: { parcella: targetParcella } });
              }
              placed = true;
              break; 
            } catch (e) { continue; }
          }
          if (placed) break;
        }
      }
      await this.audit.createLog(Number(userId), 'WAREHOUSE_SORT', undefined, null, { message: "Raktár rendezése lefutott" }, tx);
    });

    this.events.emitUpdate('products_updated', { global: true });
    return { message: "A raktár rendezése sikeresen befejeződött!" };
  }

  async create(createBatchDto: CreateBatchDto, userId: number) {
    const productId = Number(createBatchDto.productId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Termék nem található!');

    const mennyiseg = Number(createBatchDto.mennyiseg);
    await this.checkShelfCapacity(createBatchDto.parcella, mennyiseg * product.suly);

    const result = await this.prisma.$transaction(async (tx) => {
      const merged = await this.findAndMerge(
        productId, 
        createBatchDto.parcella, 
        createBatchDto.lejarat, 
        mennyiseg,
        tx
      );

      let batchResult;
      if (merged) {
        batchResult = merged;
        await this.audit.createLog(Number(userId), 'BATCH_MERGE', productId, null, merged, tx);
      } else {
        batchResult = await tx.batch.create({ 
            data: {
                ...createBatchDto,
                productId: productId,
                mennyiseg: mennyiseg,
                lejarat: (createBatchDto.lejarat as any === "" || !createBatchDto.lejarat) ? null : new Date(createBatchDto.lejarat)
            } 
        });
        await this.audit.createLog(Number(userId), 'BATCH_CREATE', productId, null, batchResult, tx);
      }
      return batchResult;
    });

    this.events.emitUpdate('products_updated', { productId: productId });
    await this.runHealthCheck(productId);
    return result;
  }

  async update(id: number, updateBatchDto: UpdateBatchDto, userId: number) {
    const batchId = Number(id);
    const existing = await this.prisma.batch.findUnique({ 
      where: { id: batchId }, 
      include: { product: true } 
    });
    
    if (!existing) throw new NotFoundException('Sarzs nem található!');

    const targetParcella = updateBatchDto.parcella || existing.parcella;
    const targetQty = updateBatchDto.mennyiseg !== undefined ? Number(updateBatchDto.mennyiseg) : existing.mennyiseg;
    
    let targetLejarat: Date | null;
    
    if (updateBatchDto.lejarat === null || updateBatchDto.lejarat === "") {
        targetLejarat = null;
    } else if (updateBatchDto.lejarat !== undefined) {
        targetLejarat = new Date(updateBatchDto.lejarat as string | number | Date);
    } else {
        targetLejarat = existing.lejarat ? new Date(existing.lejarat) : null;
    }

    await this.checkShelfCapacity(targetParcella, targetQty * existing.product.suly, batchId);

    const result = await this.prisma.$transaction(async (tx) => {
      const merged = await this.findAndMerge(existing.productId, targetParcella, targetLejarat, targetQty, tx, batchId);

      let batchResult;
      if (merged) {
        await tx.batch.delete({ where: { id: batchId } });
        batchResult = merged;
        await this.audit.createLog(Number(userId), 'BATCH_MERGE_UPDATE', existing.productId, existing, merged, tx);
      } else {
        const { lejarat, ...restDto } = updateBatchDto;
        
        batchResult = await tx.batch.update({ 
            where: { id: batchId }, 
            data: {
                ...restDto,
                mennyiseg: targetQty,
                parcella: targetParcella,
                lejarat: targetLejarat
            } 
        });
        const { product, ...oldData } = existing;
        await this.audit.createLog(Number(userId), 'BATCH_UPDATE', existing.productId, oldData, batchResult, tx);
      }
      return batchResult;
    });

    this.events.emitUpdate('products_updated', { productId: existing.productId });
    await this.runHealthCheck(existing.productId);
    return result;
  }

  async remove(id: number, userId: number) {
    const batchId = Number(id);
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Sarzs nem található!');

    await this.prisma.$transaction(async (tx) => {
      await tx.batch.delete({ where: { id: batchId } });
      await this.audit.createLog(Number(userId), 'BATCH_DELETE', batch.productId, batch, null, tx);
    });

    this.events.emitUpdate('products_updated', { productId: batch.productId });
    await this.runHealthCheck(batch.productId);
    return { message: 'Sikeres törlés' };
  }
}
