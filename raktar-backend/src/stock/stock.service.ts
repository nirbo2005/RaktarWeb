/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll() {
    return this.prisma.stock.findMany({ where: { isDeleted: false } });
  }

  // ÚJ: A findOne mostantól opcionálisan a törölteket is megtalálja
  async findOne(id: number, includeDeleted = false) {
    const stock = await this.prisma.stock.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
    });
    if (!stock) throw new NotFoundException(`Termék nem található!`);
    return stock;
  }

  async create(data: CreateStockDto, userId: number) {
    const newStock = await this.prisma.stock.create({ data: { ...data, isDeleted: false } });
    await this.audit.createLog(userId, 'CREATE', newStock.id, null, newStock);
    return newStock;
  }

  async delete(id: number, userId: number) {
    const oldData = await this.findOne(id);
    const updated = await this.prisma.stock.update({ where: { id }, data: { isDeleted: true } });
    await this.audit.createLog(userId, 'DELETE', id, oldData, null);
    return updated;
  }

  // ÚJ: Visszaállítás funkció
  async restore(id: number, userId: number) {
    const oldData = await this.findOne(id, true); // Itt engedjük a töröltet is
    const restored = await this.prisma.stock.update({ where: { id }, data: { isDeleted: false } });
    await this.audit.createLog(userId, 'RESTORE', id, { status: 'deleted' }, { status: 'active' });
    return restored;
  }

  async update(id: number, data: Partial<UpdateStockDto>, userId: number) {
    const oldData = await this.findOne(id);
    const updated = await this.prisma.stock.update({ where: { id }, data });
    await this.audit.createLog(userId, 'UPDATE', id, oldData, updated);
    return updated;
  }
}
