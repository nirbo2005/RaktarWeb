// raktar-backend/src/batch/batch.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { EventsGateway } from '../events/events.gateway';
import { Batch } from '@prisma/client';

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
   * Lekéri a raktár vizuális térképéhez szükséges adatokat
   */
  async getWarehouseMap() {
    const batches = await this.prisma.batch.findMany({
      include: { product: true },
      where: { mennyiseg: { gt: 0 } },
    });

    const shelfStats: Record<string, { weight: number; count: number; category?: string }> = {};

    batches.forEach((b) => {
      if (!shelfStats[b.parcella]) {
        shelfStats[b.parcella] = { weight: 0, count: 0, category: b.product.kategoria };
      }
      const weight = b.mennyiseg * b.product.suly;
      shelfStats[b.parcella].weight += weight;
      shelfStats[b.parcella].count += b.mennyiseg;
      if (shelfStats[b.parcella].category !== b.product.kategoria) {
        shelfStats[b.parcella].category = 'MIXED';
      }
    });

    return {
      maxWeight: MAX_WEIGHT_PER_SHELF,
      shelves: shelfStats,
    };
  }

  /**
   * Intelligens elhelyezési javaslat. 
   * Ha a súlylimit miatt nem fér el egy helyen, több polcot javasol.
   * Megengedi a kategória keveredést (a rendező gomb miatt).
   */
  async suggestPlacement(productId: number, quantity: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Termék nem található');

    const unitWeight = product.suly;
    let remainingQuantity = quantity;
    const suggestions: { parcella: string; mennyiseg: number; availableKg: number }[] = [];

    const map = await this.getWarehouseMap();
    const sectors = ['A', 'B', 'C', 'D'];

    for (const sector of sectors) {
      for (let s = 1; s <= 5; s++) {
        for (let o = 1; o <= 4; o++) {
          if (remainingQuantity <= 0) break;

          const parcella = `${sector}${s}-${o}`;
          const shelf = map.shelves[parcella];
          const currentWeight = shelf?.weight || 0;
          const remainingKg = MAX_WEIGHT_PER_SHELF - currentWeight;

          if (remainingKg >= unitWeight) {
            const canFitQty = Math.floor(remainingKg / unitWeight);
            const takeQty = Math.min(remainingQuantity, canFitQty);

            suggestions.push({
              parcella,
              mennyiseg: takeQty,
              availableKg: remainingKg - (takeQty * unitWeight)
            });

            remainingQuantity -= takeQty;
          }
        }
        if (remainingQuantity <= 0) break;
      }
      if (remainingQuantity <= 0) break;
    }

    if (remainingQuantity > 0) {
      throw new BadRequestException('A raktárban nincs elég hely a teljes mennyiségnek!');
    }

    return suggestions;
  }

  /**
   * Bulk létrehozás: Engedi a manuális bontást akkor is, ha nem indokolja súlylimit.
   */
  async createBulk(splits: CreateBatchDto[], userId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const results: Batch[] = [];
      for (const dto of splits) {
        const product = await tx.product.findUnique({ where: { id: Number(dto.productId) } });
        if (!product) throw new NotFoundException('Termék nem található');

        // Szigorú kapacitás-ellenőrzés mentéskor
        const currentBatches = await tx.batch.findMany({ 
          where: { parcella: dto.parcella }, 
          include: { product: true } 
        });
        const currentWeight = currentBatches.reduce((sum, b) => sum + (b.mennyiseg * b.product.suly), 0);
        const addedWeight = dto.mennyiseg * product.suly;
        
        if (currentWeight + addedWeight > MAX_WEIGHT_PER_SHELF + 0.01) {
          throw new BadRequestException(`A ${dto.parcella} polc túlterhelt lenne! (Max: ${MAX_WEIGHT_PER_SHELF}kg)`);
        }

        const lejaratDate = dto.lejarat ? new Date(dto.lejarat) : null;
        const existing = await tx.batch.findFirst({
          where: { productId: product.id, parcella: dto.parcella, lejarat: lejaratDate }
        });

        let res;
        if (existing) {
          res = await tx.batch.update({
            where: { id: existing.id },
            data: { mennyiseg: existing.mennyiseg + dto.mennyiseg }
          });
        } else {
          res = await tx.batch.create({
            data: {
              productId: product.id,
              parcella: dto.parcella,
              mennyiseg: dto.mennyiseg,
              lejarat: lejaratDate
            }
          });
        }
        results.push(res);
        await this.audit.createLog(userId, 'BATCH_CREATE', product.id, null, res, tx);
      }

      this.events.emitUpdate('products_updated', { global: true });
      await this.notification.checkExpiryAndStock();
      return results;
    });
  }

  async create(createBatchDto: CreateBatchDto, userId: number) {
    return this.createBulk([createBatchDto], userId);
  }

  async sortWarehouse(userId: number) {
    try {
      const before = await this.getWarehouseSnapshot();
      const allBatches = await this.prisma.batch.findMany({
        include: { product: true },
        where: { product: { isDeleted: false }, mennyiseg: { gt: 0 } },
      });

      const categories = [...new Set(allBatches.map((b) => b.product.kategoria))];
      const sectors = ['A', 'B', 'C', 'D'];

      let secIdx = 0, sNum = 1, oNum = 1;

      await this.prisma.$transaction(
        async (tx) => {
          await tx.batch.deleteMany({});

          for (const cat of categories) {
            const catBatches = allBatches.filter((b) => b.product.kategoria === cat);

            for (const batch of catBatches) {
              let remainingToPlace = batch.mennyiseg;
              const unitWeight = batch.product.suly;

              while (remainingToPlace > 0) {
                const target = `${sectors[secIdx]}${sNum}-${oNum}`;
                const currentShelfBatches = await tx.batch.findMany({
                  where: { parcella: target },
                  include: { product: true },
                });
                const currentWeight = currentShelfBatches.reduce((sum, b) => sum + b.mennyiseg * b.product.suly, 0);

                const roomInKg = MAX_WEIGHT_PER_SHELF - currentWeight;
                const roomInQty = Math.floor(roomInKg / unitWeight);

                if (roomInQty > 0) {
                  const qtyToMove = Math.min(remainingToPlace, roomInQty);
                  const lejaratVal = batch.lejarat ? new Date(batch.lejarat) : null;

                  const existing = await tx.batch.findFirst({
                    where: { productId: batch.productId, parcella: target, lejarat: lejaratVal },
                  });

                  if (existing) {
                    await tx.batch.update({ where: { id: existing.id }, data: { mennyiseg: existing.mennyiseg + qtyToMove } });
                  } else {
                    await tx.batch.create({
                      data: { productId: batch.productId, mennyiseg: qtyToMove, parcella: target, lejarat: lejaratVal, bekerules: batch.bekerules },
                    });
                  }

                  remainingToPlace -= qtyToMove;

                  if (remainingToPlace > 0 || currentWeight + qtyToMove * unitWeight >= MAX_WEIGHT_PER_SHELF - 0.5) {
                    oNum++;
                    if (oNum > 4) { oNum = 1; sNum++; }
                    if (sNum > 5) { sNum = 1; secIdx++; }
                  }
                } else {
                  oNum++;
                  if (oNum > 4) { oNum = 1; sNum++; }
                  if (sNum > 5) { sNum = 1; secIdx++; }
                }
                if (secIdx >= sectors.length) throw new Error('A raktár megtelt a rendezés közben!');
              }
            }
            const currentTarget = `${sectors[secIdx]}${sNum}-${oNum}`;
            const currentCount = await tx.batch.count({ where: { parcella: currentTarget } });
            if (currentCount > 0) {
              oNum++;
              if (oNum > 4) { oNum = 1; sNum++; }
              if (sNum > 5) { sNum = 1; secIdx++; }
            }
          }
          await this.audit.createLog(Number(userId), 'WAREHOUSE_SORT', undefined, before, { message: 'Optimalizált rendezés lefutott' }, tx);
        },
        { timeout: 120000 },
      );

      this.events.emitUpdate('products_updated', { global: true });
      return { message: 'Sikeres rendezés!' };
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async update(id: number, updateBatchDto: UpdateBatchDto, userId: number) {
    const batchId = Number(id);
    const existing = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });
    if (!existing) throw new NotFoundException('Sarzs nem található!');

    return await this.prisma.$transaction(async (tx) => {
      if (updateBatchDto.parcella && updateBatchDto.parcella !== existing.parcella) {
        const moveQty = updateBatchDto.mennyiseg ?? existing.mennyiseg;
        const targetBatches = await tx.batch.findMany({ where: { parcella: updateBatchDto.parcella }, include: { product: true } });
        const targetWeight = targetBatches.reduce((sum, b) => sum + (b.mennyiseg * b.product.suly), 0);

        if (targetWeight + (moveQty * existing.product.suly) > MAX_WEIGHT_PER_SHELF) {
          throw new BadRequestException(`A célpolc (${updateBatchDto.parcella}) nem bír el ennyi plusz súlyt!`);
        }

        const targetSameBatch = await tx.batch.findFirst({
          where: { productId: existing.productId, parcella: updateBatchDto.parcella, lejarat: existing.lejarat },
        });

        let updatedTarget;
        let auditType = moveQty < existing.mennyiseg ? 'MOVE_SPLIT' : 'MOVE_FULL';

        if (targetSameBatch) {
          updatedTarget = await tx.batch.update({ where: { id: targetSameBatch.id }, data: { mennyiseg: targetSameBatch.mennyiseg + moveQty } });
          auditType = moveQty < existing.mennyiseg ? 'MOVE_SPLIT_MERGE' : 'MOVE_MERGE';
        } else {
          updatedTarget = await tx.batch.create({
            data: { productId: existing.productId, parcella: updateBatchDto.parcella, mennyiseg: moveQty, lejarat: existing.lejarat, bekerules: existing.bekerules }
          });
        }

        let updatedSource: Batch | null = null;
        if (moveQty < existing.mennyiseg) {
          updatedSource = await tx.batch.update({ where: { id: batchId }, data: { mennyiseg: existing.mennyiseg - moveQty } });
        } else {
          await tx.batch.delete({ where: { id: batchId } });
        }

        await this.audit.createLog(userId, 'BATCH_UPDATE', existing.productId, { ...existing, _logType: 'SOURCE' }, 
          { source: updatedSource, target: updatedTarget, _moveType: auditType, _movedQty: moveQty }, tx);
        
        this.events.emitUpdate('products_updated', { global: true });
        await this.notification.checkExpiryAndStock();
        return updatedTarget;
      }

      const updated = await tx.batch.update({
        where: { id: batchId },
        data: {
          ...updateBatchDto,
          lejarat: updateBatchDto.lejarat === null ? null : (updateBatchDto.lejarat ? new Date(updateBatchDto.lejarat as any) : undefined),
        },
      });

      await this.audit.createLog(userId, 'BATCH_UPDATE', existing.productId, existing, updated, tx);
      this.events.emitUpdate('products_updated', { global: true });
      await this.notification.checkExpiryAndStock();
      return updated;
    });
  }

  async remove(id: number, userId: number) {
    const batchId = Number(id);
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Sarzs nem található!');

    await this.prisma.$transaction(async (tx) => {
      await tx.batch.delete({ where: { id: batchId } });
      await this.audit.createLog(Number(userId), 'BATCH_DELETE', batch.productId, batch, null, tx);
    });

    this.events.emitUpdate('products_updated', { global: true });
    await this.notification.checkExpiryAndStock();
    return { message: 'Sikeres törlés' };
  }

  private async getWarehouseSnapshot() {
    const batches = await this.prisma.batch.findMany({
      include: { product: true },
      where: { mennyiseg: { gt: 0 } },
    });
    let totalWeight = 0, totalValue = 0, totalItems = 0;
    const shelfMap: Record<string, { category: string; weight: number }> = {};
    batches.forEach((b) => {
      const weight = b.mennyiseg * b.product.suly;
      totalWeight += weight; totalValue += b.mennyiseg * b.product.eladasiAr; totalItems += b.mennyiseg;
      if (!shelfMap[b.parcella]) shelfMap[b.parcella] = { category: b.product.kategoria, weight: 0 };
      shelfMap[b.parcella].weight += weight;
      if (shelfMap[b.parcella].category !== b.product.kategoria) shelfMap[b.parcella].category = 'MIXED!!!';
    });
    return { 
      totalWeight: Number(totalWeight.toFixed(2)), 
      totalValue, 
      totalItems, 
      mixedShelves: Object.keys(shelfMap).filter((s) => shelfMap[s].category === 'MIXED!!!'),
      overloadedShelves: Object.keys(shelfMap).filter((s) => shelfMap[s].weight > MAX_WEIGHT_PER_SHELF + 0.1)
    };
  }
}
