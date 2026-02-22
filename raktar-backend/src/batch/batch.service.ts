import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  InternalServerErrorException 
} from '@nestjs/common';
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
   * Lejárati és készlet ellenőrzés
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
      } else if (diffDays === 7) {
        await this.notification.createGlobalNotification(
          `LEJÁRAT FIGYELMEZTETÉS: ${product.nev} (${batch.parcella}) 1 hét múlva lejár!`,
          'INFO'
        );
      }
    }
  }

  /**
   * Raktár statisztika a validációhoz
   */
  private async getWarehouseSnapshot() {
    const batches = await this.prisma.batch.findMany({
      include: { product: true },
      where: { mennyiseg: { gt: 0 } }
    });

    let totalWeight = 0;
    let totalValue = 0;
    let totalItems = 0;
    const shelfMap: Record<string, { category: string; weight: number }> = {};

    batches.forEach(b => {
      const weight = b.mennyiseg * b.product.suly;
      totalWeight += weight;
      totalValue += b.mennyiseg * b.product.eladasiAr;
      totalItems += b.mennyiseg;

      if (!shelfMap[b.parcella]) {
        shelfMap[b.parcella] = { category: b.product.kategoria, weight: 0 };
      }
      shelfMap[b.parcella].weight += weight;
      if (shelfMap[b.parcella].category !== b.product.kategoria) {
        shelfMap[b.parcella].category = 'MIXED!!!';
      }
    });

    return {
      totalWeight: Number(totalWeight.toFixed(2)),
      totalValue,
      totalItems,
      mixedShelves: Object.keys(shelfMap).filter(s => shelfMap[s].category === 'MIXED!!!'),
      overloadedShelves: Object.keys(shelfMap).filter(s => shelfMap[s].weight > MAX_WEIGHT_PER_SHELF + 0.1),
    };
  }

  /**
   * Új sarzs létrehozása automatikus szétosztással (splitting)
   */
  async create(createBatchDto: CreateBatchDto, userId: number) {
    const productId = Number(createBatchDto.productId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Termék nem található!');

    let remainingQty = Number(createBatchDto.mennyiseg);
    const unitWeight = product.suly;
    const results: any[] = []; // Típus fix: never[] helyett any[]

    await this.prisma.$transaction(async (tx) => {
      const sectors = ['A', 'B', 'C', 'D'];
      
      for (const sector of sectors) {
        for (let s = 1; s <= 5; s++) {
          for (let o = 1; o <= 4; o++) {
            if (remainingQty <= 0) break;
            const targetParcella = `${sector}${s}-${o}`;
            
            const currentBatches = await tx.batch.findMany({ 
              where: { parcella: targetParcella }, 
              include: { product: true } 
            });
            const currentWeight = currentBatches.reduce((sum, b) => sum + (b.mennyiseg * b.product.suly), 0);
            const shelfCategory = currentBatches[0]?.product.kategoria;

            if (!shelfCategory || shelfCategory === product.kategoria) {
              const availableWeight = MAX_WEIGHT_PER_SHELF - currentWeight;
              const canFitQty = Math.floor(availableWeight / unitWeight);

              if (canFitQty > 0) {
                const qtyToPlace = Math.min(remainingQty, canFitQty);
                const lejaratDate = createBatchDto.lejarat ? new Date(createBatchDto.lejarat) : null;
                
                const duplicate = await tx.batch.findFirst({
                  where: { productId: product.id, parcella: targetParcella, lejarat: lejaratDate }
                });

                if (duplicate) {
                  const updated = await tx.batch.update({ 
                    where: { id: duplicate.id }, 
                    data: { mennyiseg: duplicate.mennyiseg + qtyToPlace } 
                  });
                  results.push(updated);
                } else {
                  const created = await tx.batch.create({
                    data: { 
                      productId: product.id,
                      mennyiseg: qtyToPlace,
                      parcella: targetParcella,
                      lejarat: lejaratDate
                    }
                  });
                  results.push(created);
                }
                remainingQty -= qtyToPlace;
              }
            }
          }
          if (remainingQty <= 0) break;
        }
        if (remainingQty <= 0) break;
      }
      
      if (remainingQty > 0) throw new BadRequestException("Nincs elég hely a raktárban a termék szétosztásához!");
      await this.audit.createLog(Number(userId), 'BATCH_CREATE_SPLIT', productId, null, { items: results.length }, tx);
    });

    this.events.emitUpdate('products_updated', { global: true });
    await this.runHealthCheck(productId);
    return results;
  }

  /**
   * RENDEZÉS: Kategória-izolált, automatikus sarzs-hasítás
   */
  async sortWarehouse(userId: number) {
    try {
      const before = await this.getWarehouseSnapshot();
      console.log('--- 🛡️ INDULÓ ÁLLAPOT ---', before);

      const allBatches = await this.prisma.batch.findMany({ 
        include: { product: true },
        where: { product: { isDeleted: false }, mennyiseg: { gt: 0 } }
      });

      const categories = [...new Set(allBatches.map(b => b.product.kategoria))];
      const sectors = ['A', 'B', 'C', 'D'];
      
      let secIdx = 0, sNum = 1, oNum = 1;

      await this.prisma.$transaction(async (tx) => {
        await tx.batch.deleteMany({}); // Raktár kiürítése a virtuális újrarendezéshez

        for (const cat of categories) {
          const catBatches = allBatches.filter(b => b.product.kategoria === cat);
          
          for (const batch of catBatches) {
            let remainingToPlace = batch.mennyiseg;
            const unitWeight = batch.product.suly;

            while (remainingToPlace > 0) {
              const target = `${sectors[secIdx]}${sNum}-${oNum}`;
              
              const currentShelfBatches = await tx.batch.findMany({ where: { parcella: target }, include: { product: true } });
              const currentWeight = currentShelfBatches.reduce((sum, b) => sum + (b.mennyiseg * b.product.suly), 0);
              
              const roomInKg = MAX_WEIGHT_PER_SHELF - currentWeight;
              const roomInQty = Math.floor(roomInKg / unitWeight);

              if (roomInQty > 0) {
                const qtyToMove = Math.min(remainingToPlace, roomInQty);
                const lejaratVal = batch.lejarat ? new Date(batch.lejarat) : null;

                const existing = await tx.batch.findFirst({
                  where: { productId: batch.productId, parcella: target, lejarat: lejaratVal }
                });

                if (existing) {
                  await tx.batch.update({ where: { id: existing.id }, data: { mennyiseg: existing.mennyiseg + qtyToMove } });
                } else {
                  await tx.batch.create({
                    data: {
                      productId: batch.productId,
                      mennyiseg: qtyToMove,
                      parcella: target,
                      lejarat: lejaratVal,
                      bekerules: batch.bekerules // Typo fix: beszerzesDatum -> bekerules
                    }
                  });
                }

                remainingToPlace -= qtyToMove;
                
                if (remainingToPlace > 0 || (currentWeight + (qtyToMove * unitWeight) >= MAX_WEIGHT_PER_SHELF - 0.5)) {
                  oNum++;
                  if (oNum > 4) { oNum = 1; sNum++; }
                  if (sNum > 5) { sNum = 1; secIdx++; }
                }
              } else {
                oNum++;
                if (oNum > 4) { oNum = 1; sNum++; }
                if (sNum > 5) { sNum = 1; secIdx++; }
              }

              if (secIdx >= sectors.length) throw new Error("A raktár megtelt a rendezés közben!");
            }
          }
          // Kategória váltás: kényszerített polclépés
          const currentTarget = `${sectors[secIdx]}${sNum}-${oNum}`;
          const currentCount = await tx.batch.count({ where: { parcella: currentTarget } }); // Await fix
          
          if (currentCount > 0) {
            oNum++;
            if (oNum > 4) { oNum = 1; sNum++; }
            if (sNum > 5) { sNum = 1; secIdx++; }
          }
        }
        await this.audit.createLog(Number(userId), 'WAREHOUSE_SORT_OPTIMIZED', undefined, null, { message: "Súly- és kategória-optimalizált rendezés" }, tx);
      }, { timeout: 120000 });

      const after = await this.getWarehouseSnapshot();
      console.log('--- ✅ VÉGEREDMÉNY ---', after);

      if (Math.abs(after.totalWeight - before.totalWeight) > 0.5) throw new Error("Súlyeltérés történt!");
      if (after.totalItems !== before.totalItems) throw new Error("Darabszám eltérés történt!");

      this.events.emitUpdate('products_updated', { global: true });
      return { message: "Sikeres, hiba mentes rendezés!", stats: { before, after } };
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e.message);
    }
  }

  async update(id: number, updateBatchDto: UpdateBatchDto, userId: number) {
    const batchId = Number(id);
    const existing = await this.prisma.batch.findUnique({ 
      where: { id: batchId }, 
      include: { product: true } 
    });
    
    if (!existing) throw new NotFoundException('Sarzs nem található!');

    const targetQty = updateBatchDto.mennyiseg !== undefined ? Number(updateBatchDto.mennyiseg) : existing.mennyiseg;
    const targetWeight = targetQty * existing.product.suly;

    if (targetWeight > MAX_WEIGHT_PER_SHELF) {
      throw new BadRequestException(`Egy sarzs nem lehet nehezebb ${MAX_WEIGHT_PER_SHELF} kg-nál! Használd a létrehozást a szétosztáshoz.`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const { lejarat, ...restDto } = updateBatchDto;
      const batchResult = await tx.batch.update({ 
          where: { id: batchId }, 
          data: {
              ...restDto,
              mennyiseg: targetQty,
              lejarat: lejarat === null ? null : (lejarat ? new Date(lejarat as any) : undefined)
          } 
      });
      const { product, ...oldData } = existing;
      await this.audit.createLog(Number(userId), 'BATCH_UPDATE', existing.productId, oldData, batchResult, tx);
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
