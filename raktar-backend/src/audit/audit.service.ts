import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, isAdmin: boolean) {
    return this.prisma.auditLog.findMany({
      where: isAdmin ? {} : { userId: userId },
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
