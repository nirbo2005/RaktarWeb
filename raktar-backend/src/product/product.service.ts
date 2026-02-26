// raktar-backend/src/product/product.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private events: EventsGateway,
    private notifications: NotificationService,
  ) {}

  private async checkStockLevels(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { batches: true },
    });

    if (!product || product.isDeleted) return;

    const totalStock = product.batches.reduce((sum, b) => sum + b.mennyiseg, 0);
    if (totalStock <= product.minimumKeszlet) {
      await this.notifications.createGlobalNotification(
        `ALACSONY KÉSZLET: ${product.nev} összesen már csak ${totalStock} db!`,
        'WARNING',
        product.id,
      );
    }
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { isDeleted: false },
      include: { batches: true },
    });
  }

  async findOne(id: number, includeDeleted = false) {
    const product = await this.prisma.product.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
      include: { batches: true },
    });
    if (!product) throw new NotFoundException(`Termék nem található!`);
    return product;
  }

  async create(data: CreateProductDto, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: { ...data, isDeleted: false },
      });
      
      await this.audit.createLog(
        userId,
        'PRODUCT_CREATE',
        newProduct.id,
        null,
        newProduct,
        tx,
      );
      return newProduct;
    });

    this.events.emitUpdate('products_updated', {
      type: 'CREATE',
      productId: result.id,
    });
    return result;
  }

  async update(id: number, data: Partial<UpdateProductDto>, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const oldData = await tx.product.findUnique({
        where: { id: Number(id) },
      });
      if (!oldData) throw new NotFoundException('Termék nem található!');

      const updated = await tx.product.update({
        where: { id: Number(id) },
        data: data,
      });

      await this.audit.createLog(
        userId,
        'PRODUCT_UPDATE',
        updated.id,
        oldData,
        updated,
        tx,
      );
      return updated;
    });

    await this.checkStockLevels(Number(id));
    this.events.emitUpdate('products_updated', {
      type: 'UPDATE',
      productId: id,
    });
    return result;
  }

  async delete(id: number, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const oldData = await tx.product.findUnique({
        where: { id: Number(id) },
      });
      if (!oldData) throw new NotFoundException('Termék nem található!');

      const updated = await tx.product.update({
        where: { id: Number(id) },
        data: { isDeleted: true },
      });

      await this.audit.createLog(
        userId,
        'PRODUCT_DELETE',
        id,
        oldData,
        { ...oldData, isDeleted: true },
        tx,
      );
      return updated;
    });

    this.events.emitUpdate('products_updated', {
      type: 'DELETE',
      productId: id,
    });
    return result;
  }

  async deleteMany(ids: number[], userId: number) {
    if (!ids || ids.length === 0)
      throw new BadRequestException('Nincs ID megadva');
    const numericIds = ids.map((id) => Number(id));

    try {
      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: numericIds } },
      });

      if (existingProducts.length === 0)
        throw new NotFoundException('Nem találhatók a termékek');

      const result = await this.prisma.$transaction(async (tx) => {
        const update = await tx.product.updateMany({
          where: { id: { in: numericIds } },
          data: { isDeleted: true },
        });

        for (const product of existingProducts) {
          await this.audit.createLog(
            userId,
            'PRODUCT_BULK_DELETE',
            product.id,
            product,
            { ...product, isDeleted: true },
            tx,
          );
        }
        return update;
      });

      this.events.emitUpdate('products_updated', {
        type: 'BULK_DELETE',
        ids: numericIds,
      });
      return { success: true, count: result.count };
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Hiba a tömeges törlés során: ' + error.message,
      );
    }
  }

  async restore(id: number, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const oldData = await tx.product.findUnique({
        where: { id: Number(id) },
      });
      const restored = await tx.product.update({
        where: { id: Number(id) },
        data: { isDeleted: false },
      });

      await this.audit.createLog(
        userId,
        'PRODUCT_RESTORE',
        id,
        oldData,
        restored,
        tx,
      );
      return restored;
    });

    await this.checkStockLevels(Number(id));
    this.events.emitUpdate('products_updated', {
      type: 'RESTORE',
      productId: id,
    });
    return result;
  }

  async restoreFromLog(logId: number, userId: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: Number(logId) },
    });

    if (!log) throw new NotFoundException('Naplóbejegyzés nem található!');
    if (!log.productId)
      throw new BadRequestException('Nincs kapcsolódó termék!');

    let result;
    if (
      log.muvelet === 'PRODUCT_DELETE' ||
      log.muvelet === 'PRODUCT_BULK_DELETE'
    ) {
      result = await this.restore(log.productId, userId);
    } else if (log.muvelet === 'PRODUCT_UPDATE' && log.regiAdat) {
      result = await this.prisma.$transaction(async (tx) => {
        const restored = await tx.product.update({
          where: { id: log.productId as number },
          data: log.regiAdat as any,
        });

        await this.audit.createLog(
          userId,
          'PRODUCT_RESTORE',
          log.productId as number,
          log.ujAdat,
          log.regiAdat,
          tx,
        );
        return restored;
      });
      
      await this.checkStockLevels(log.productId);
      this.events.emitUpdate('products_updated', {
        type: 'RESTORE',
        productId: log.productId,
      });
    } else if (log.muvelet === 'PRODUCT_CREATE') {
      result = await this.delete(log.productId, userId);
    } else {
      throw new BadRequestException('Ez a művelet nem vonható vissza!');
    }

    return result;
  }
}
