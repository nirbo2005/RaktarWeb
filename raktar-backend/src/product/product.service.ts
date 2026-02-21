//raktar-backend/src/product/product.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { isDeleted: false },
    });
  }

  async findOne(id: number, includeDeleted = false) {
    const product = await this.prisma.product.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
    });
    if (!product) throw new NotFoundException(`Termék nem található!`);
    return product;
  }

  async create(data: CreateProductDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: { ...data, isDeleted: false },
      });
      await this.audit.createLog(userId, 'CREATE', newProduct.id, null, newProduct, tx);
      return newProduct;
    });
  }

  async update(id: number, data: Partial<UpdateProductDto>, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const oldData = await tx.product.findUnique({ where: { id: Number(id) } });
      if (!oldData) throw new NotFoundException('Termék nem található!');

      const updated = await tx.product.update({
        where: { id: Number(id) },
        data: data,
      });

      await this.audit.createLog(userId, 'UPDATE', id, oldData, updated, tx);
      return updated;
    });
  }

  async delete(id: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const oldData = await tx.product.findUnique({ where: { id: Number(id) } });
      if (!oldData) throw new NotFoundException('Termék nem található!');

      const updated = await tx.product.update({
        where: { id: Number(id) },
        data: { isDeleted: true },
      });

      await this.audit.createLog(
        userId,
        'DELETE',
        id,
        oldData,
        { ...oldData, isDeleted: true },
        tx,
      );
      return updated;
    });
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

      // 1. PONT JAVÍTÁSA: Logika szétválasztása
      // Ha csak 1 elem van, akkor sima DELETE, ha több, akkor BULK_DELETE
      const operationType = existingProducts.length > 1 ? 'BULK_DELETE' : 'DELETE';

      const result = await this.prisma.$transaction(async (tx) => {
        const update = await tx.product.updateMany({
          where: { id: { in: numericIds } },
          data: { isDeleted: true },
        });

        for (const product of existingProducts) {
          await tx.auditLog.create({
            data: {
              userId: userId,
              muvelet: operationType, // A dinamikus típus használata
              productId: product.id,
              regiAdat: JSON.parse(JSON.stringify(product)),
              ujAdat: JSON.parse(
                JSON.stringify({ ...product, isDeleted: true }),
              ),
            },
          });
        }

        return update;
      });

      return { success: true, count: result.count };
    } catch (error) {
      throw new InternalServerErrorException(
        'Hiba a tömeges törlés során: ' + error.message,
      );
    }
  }

  async restore(id: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const restored = await tx.product.update({
        where: { id: Number(id) },
        data: { isDeleted: false },
      });

      await this.audit.createLog(
        userId,
        'RESTORE',
        id,
        { status: 'deleted' },
        { status: 'active' },
        tx,
      );
      return restored;
    });
  }

  async restoreFromLog(logId: number, userId: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: Number(logId) },
    });

    if (!log) throw new NotFoundException('Naplóbejegyzés nem található!');
    if (!log.productId) throw new BadRequestException('Nincs kapcsolódó termék!');

    // 2. PONT JAVÍTÁSA: A BULK_DELETE is visszavonható ugyanúgy, mint a sima DELETE
    if (log.muvelet === 'DELETE' || log.muvelet === 'BULK_DELETE') {
      return this.restore(log.productId, userId);
    }

    if (log.muvelet === 'UPDATE' && log.regiAdat) {
      return this.prisma.$transaction(async (tx) => {
        const restored = await tx.product.update({
          where: { id: log.productId as number },
          data: log.regiAdat as any,
        });

        await this.audit.createLog(
          userId,
          'RESTORE',
          log.productId as number,
          log.ujAdat,
          log.regiAdat,
          tx,
        );
        return restored;
      });
    }

    throw new BadRequestException('Ez a művelet nem vonható vissza!');
  }
}
