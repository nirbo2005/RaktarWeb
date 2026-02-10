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

  async delete(id: number, userId: number) {
    const oldData = await this.findOne(id);
    const updated = await this.prisma.stock.update({
      where: { id: Number(id) },
      data: { isDeleted: true },
    });
    await this.audit.createLog(userId, 'DELETE', id, oldData, null);
    return updated;
  }

  async restore(id: number, userId: number) {
    const restored = await this.prisma.stock.update({
      where: { id: Number(id) },
      data: { isDeleted: false },
    });
    await this.audit.createLog(userId, 'RESTORE', id, { status: 'deleted' }, { status: 'active' });
    return restored;
  }

  /**
   * Visszaállítás konkrét naplóbejegyzés alapján
   */
  async restoreFromLog(logId: number, userId: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: Number(logId) },
    });

    if (!log) throw new NotFoundException('Naplóbejegyzés nem található!');
    if (!log.stockId) throw new BadRequestException('Nincs kapcsolódó termék!');

    // TÖRLÉS VISSZAVONÁSA
    if (log.muvelet === 'DELETE') {
      return this.restore(log.stockId, userId);
    }

    // MÓDOSÍTÁS VISSZAVONÁSA (Visszaírjuk a régi adatokat)
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
