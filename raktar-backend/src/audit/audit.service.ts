import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  // Logok lekérése jogosultság alapján
  async findAll(userId: number, isAdmin: boolean) {
    return this.prisma.auditLog.findMany({
      where: isAdmin ? {} : { userId: userId }, // Admin mindent lát, a raktáros csak a sajátját
      include: {
        user: {
          select: { nev: true, felhasznalonev: true }
        },
        stock: {
          select: { nev: true }
        }
      },
      orderBy: {
        idopont: 'desc' // A legfrissebb esemény legyen legfelül
      }
    });
  }

  // Új log bejegyzés létrehozása (Ezt hívjuk majd a StockService-ből)
  async createLog(userId: number, muvelet: string, stockId?: number, regiAdat?: any, ujAdat?: any) {
    return this.prisma.auditLog.create({
      data: {
        muvelet,
        userId,
        stockId,
        regiAdat: regiAdat ? JSON.parse(JSON.stringify(regiAdat)) : null,
        ujAdat: ujAdat ? JSON.parse(JSON.stringify(ujAdat)) : null,
      }
    });
  }
}
