// raktar-backend/src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async getMyNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId: Number(userId) },
      orderBy: { letrehozva: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: number, userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: Number(id),
        userId: Number(userId),
      },
      data: { isRead: true },
    });

    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
    return result;
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: Number(userId),
        isRead: false,
      },
      data: { isRead: true },
    });

    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
    return result;
  }

  async deleteReadNotifications(userId: number) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId: Number(userId),
        isRead: true,
      },
    });

    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
    return result;
  }

  async createGlobalNotification(uzenet: string, tipus: string = 'INFO', productId?: number) {
    const recentTime = new Date(Date.now() - 10 * 60 * 1000);
    const isDuplicate = await this.prisma.notification.findFirst({
      where: {
        uzenet,
        productId: productId || null,
        letrehozva: { gte: recentTime },
      },
    });

    if (isDuplicate) return;

    const targetUsers = await this.prisma.user.findMany({
      where: {
        rang: { in: ['ADMIN', 'KEZELO'] },
        isBanned: false,
      },
      select: { id: true },
    });

    if (targetUsers.length === 0) return;

    await this.prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        uzenet,
        tipus,
        productId: productId || null,
        isRead: false,
      })),
    });

    targetUsers.forEach((u) => {
      this.events.emitUpdate('notifications_updated', { userId: u.id });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiryAndStock() {
    this.logger.log('Napi készlet és lejárat ellenőrzés indítása...');
    
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false },
      include: { batches: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const product of products) {
      const totalStock = product.batches.reduce((sum, b) => sum + b.mennyiseg, 0);
      if (totalStock <= product.minimumKeszlet) {
        await this.createGlobalNotification(
          `ALACSONY KÉSZLET: ${product.nev} összesen már csak ${totalStock} db!`,
          'WARNING',
          product.id
        );
      }

      for (const batch of product.batches) {
        if (!batch.lejarat) continue; // JAVÍTVA: lejarat használata lejaratiDatum helyett

        const expiryDate = new Date(batch.lejarat); // JAVÍTVA: lejarat
        expiryDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 7 || diffDays === 2) {
          await this.createGlobalNotification(
            `LEJÁRAT FIGYELMEZTETÉS: ${product.nev} (${batch.parcella}) lejár ${diffDays} nap múlva!`,
            diffDays === 2 ? 'ERROR' : 'WARNING',
            product.id
          );
        } else if (diffDays <= 0) {
          await this.createGlobalNotification(
            `LEJÁRT TERMÉK: ${product.nev} (${batch.parcella}) lejárati ideje a mai napon lejárt!`,
            'ERROR',
            product.id
          );
        }
      }
    }
  }
}
