//raktar-backend/src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GetLogsQueryDto } from './dto/get-logs-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, query: GetLogsQueryDto) {
    const { targetUserId, admin, muvelet, productId, startDate, endDate } = query;
    const where: Prisma.AuditLogWhereInput = {};

    if (!admin) {
      where.userId = userId;
    } else if (targetUserId) {
      where.userId = Number(targetUserId);
    }

    if (muvelet) {
      where.muvelet = muvelet;
    }

    if (productId) {
      where.productId = Number(productId);
    }

    if (startDate || endDate) {
      where.idopont = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) where.idopont.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          where.idopont.lte = end;
        }
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, nev: true, felhasznalonev: true },
        },
        product: {
          select: { id: true, nev: true },
        },
      },
      orderBy: {
        idopont: 'desc',
      },
    });
  }

  async createLog(
    userId: number,
    muvelet: string,
    productId?: number,
    regiAdat?: any,
    ujAdat?: any,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    const cleanRegi = regiAdat ? JSON.parse(JSON.stringify(regiAdat)) : null;
    const cleanUj = ujAdat ? JSON.parse(JSON.stringify(ujAdat)) : null;

    return client.auditLog.create({
      data: {
        muvelet,
        userId,
        productId: productId ? Number(productId) : null,
        regiAdat: cleanRegi,
        ujAdat: cleanUj,
      },
    });
  }
}
