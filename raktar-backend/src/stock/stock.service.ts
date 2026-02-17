/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StockService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.stock.findMany({ 
      where: { isDeleted: false } 
    });
  }

  async findOne(id: number, includeDeleted = false) {
    const stock = await this.prisma.stock.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
    });
    if (!stock) throw new NotFoundException(`Termék nem található!`);
    return stock;
  }

  async create(data: CreateStockDto, userId: number) {
    const newStock = await this.prisma.stock.create({
      data: { ...data, isDeleted: false },
    });
    await this.audit.createLog(userId, 'CREATE', newStock.id, null, newStock);
    return newStock;
  }

  async update(id: number, data: Partial<UpdateStockDto>, userId: number) {
    const oldData = await this.findOne(id);
    const updated = await this.prisma.stock.update({
      where: { id: Number(id) },
      data: data,
    });
    await this.audit.createLog(userId, 'UPDATE', id, oldData, updated);
    return updated;
  }

  // --- EGYEDI TÖRLÉS FRISSÍTVE ---
  async delete(id: number, userId: number) {
    const oldData = await this.findOne(id);
    const updated = await this.prisma.stock.update({
      where: { id: Number(id) },
      data: { isDeleted: true }, // Boolean -> MySQL-nél 1 lesz
    });
    await this.audit.createLog(userId, 'DELETE', id, oldData, { ...oldData, isDeleted: true });
    return updated;
  }

  // --- TÖMEGES TÖRLÉS FRISSÍTVE ---
  async deleteMany(ids: number[], userId: number) {
    if (!ids || ids.length === 0) throw new BadRequestException('Nincs ID megadva');

    const numericIds = ids.map(id => Number(id));

    try {
      // 1. Megkeressük az adatokat a naplóhoz a törlés ELŐTT
      const existingProducts = await this.prisma.stock.findMany({
        where: { id: { in: numericIds } }
      });

      if (existingProducts.length === 0) throw new NotFoundException('Nem találhatók a termékek');

      // 2. Tömeges frissítés tranzakcióban
      const result = await this.prisma.$transaction(async (tx) => {
        const update = await tx.stock.updateMany({
          where: { id: { in: numericIds } },
          data: { isDeleted: true },
        });

        // 3. Naplózás (ha az AuditService elszállna, a tranzakció is bukik - ezért itt manuálisan mentünk)
        // A regiAdat és ujAdat mezőknek érvényes JSON-nek kell lenniük
        for (const product of existingProducts) {
          await tx.auditLog.create({
            data: {
              userId: userId,
              muvelet: 'BULK_DELETE',
              stockId: product.id,
              regiAdat: JSON.parse(JSON.stringify(product)),
              ujAdat: JSON.parse(JSON.stringify({ ...product, isDeleted: true }))
            }
          });
        }

        return update;
      });

      return { success: true, count: result.count };

    } catch (error) {
      console.error('RENDER ERROR LOG:', error); // Ezt fogod látni a Render dashboardon
      throw new InternalServerErrorException('Hiba a tömeges törlés során: ' + error.message);
    }
  }

  async restore(id: number, userId: number) {
    const restored = await this.prisma.stock.update({
      where: { id: Number(id) },
      data: { isDeleted: false },
    });
    await this.audit.createLog(userId, 'RESTORE', id, { status: 'deleted' }, { status: 'active' });
    return restored;
  }

  async restoreFromLog(logId: number, userId: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: Number(logId) },
    });

    if (!log) throw new NotFoundException('Naplóbejegyzés nem található!');
    if (!log.stockId) throw new BadRequestException('Nincs kapcsolódó termék!');

    if (log.muvelet === 'DELETE') {
      return this.restore(log.stockId, userId);
    }

    if (log.muvelet === 'UPDATE' && log.regiAdat) {
      const restored = await this.prisma.stock.update({
        where: { id: log.stockId },
        data: log.regiAdat as any,
      });
      await this.audit.createLog(userId, 'RESTORE', log.stockId, log.ujAdat, log.regiAdat);
      return restored;
    }

    throw new BadRequestException('Ez a művelet nem vonható vissza!');
  }
}
