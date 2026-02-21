//raktar-backend/src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GetLogsQueryDto } from './dto/get-logs-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, query: GetLogsQueryDto) {
    const {
      targetUserId,
      admin,
      muvelet,
      stockId,
      startDate,
      endDate,
    } = query;

    const where: Prisma.AuditLogWhereInput = {};

    if (!admin) {
      where.userId = userId;
    } else if (targetUserId) {
      where.userId = targetUserId;
    }

    if (muvelet) {
      where.muvelet = muvelet;
    }

    if (stockId) {
      where.stockId = stockId;
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
          select: { nev: true, felhasznalonev: true },
        },
        stock: {
          select: { nev: true },
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
    stockId?: number,
    regiAdat?: any,
    ujAdat?: any,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;
    return prismaClient.auditLog.create({
      data: {
        muvelet,
        userId,
        stockId,
        regiAdat: regiAdat ? JSON.parse(JSON.stringify(regiAdat)) : null,
        ujAdat: ujAdat ? JSON.parse(JSON.stringify(ujAdat)) : null,
      },
    });
  }
}
