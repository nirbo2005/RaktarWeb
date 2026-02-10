import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    userId?: number;
    targetUserId?: number; // Admin szűréséhez: ki követte el?
    isAdmin: boolean;
    muvelet?: string;
    stockId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { userId, targetUserId, isAdmin, muvelet, stockId, startDate, endDate } = query;

    const where: any = {};
    
    // Alap szűrő: Ha nem admin, csak a sajátját látja
    if (!isAdmin) {
      where.userId = userId;
    } else if (targetUserId) {
      // Admin szűrhet konkrét felhasználóra a frontendről érkező ID alapján
      where.userId = Number(targetUserId);
    }

    // Művelet típus szűrés
    if (muvelet) {
      where.muvelet = muvelet;
    }

    // Konkrét termékre szűrés
    if (stockId) {
      where.stockId = Number(stockId);
    }

    // Idősáv szűrés
    if (startDate || endDate) {
      where.idopont = {};
      if (startDate) {
        where.idopont.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.idopont.lte = end;
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
  ) {
    return this.prisma.auditLog.create({
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
