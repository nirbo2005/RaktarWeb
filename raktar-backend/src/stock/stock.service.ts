/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Nincs megadva törlendő azonosító!');
    }

    const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));

    // 1. Lekérjük a termékeket a naplózáshoz
    const productsToDelete = await this.prisma.stock.findMany({
      where: { 
        id: { in: numericIds },
        isDeleted: false 
      },
    });

    if (productsToDelete.length === 0) {
      throw new NotFoundException('A megadott termékek már törölve vannak vagy nem léteznek.');
    }

    // 2. Tranzakció indítása
    return await this.prisma.$transaction(async (tx) => {
      // Tömeges státusz frissítés
      const updateResult = await tx.stock.updateMany({
        where: { id: { in: productsToDelete.map(p => p.id) } },
        data: { isDeleted: true },
      });

      // Tömeges naplózás előkészítése/végrehajtása
      for (const product of productsToDelete) {
        await this.audit.createLog(
          userId, 
          'DELETE', 
          product.id, 
          product, 
          { ...product, isDeleted: true }
        );
      }

      return {
        success: true,
        count: updateResult.count,
        message: `${updateResult.count} termék sikeresen törölve.`
      };
    });
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
