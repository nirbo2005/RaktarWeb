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
      where: { 
        userId: Number(userId),
        isDeleted: false 
      },
      orderBy: { letrehozva: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: number, userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { id: Number(id), userId: Number(userId), isDeleted: false },
      data: { isRead: true },
    });
    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
    return result;
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: Number(userId), isRead: false, isDeleted: false },
      data: { isRead: true },
    });
    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
    return result;
  }

  async deleteReadNotifications(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: Number(userId), isRead: true, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
    return result;
  }

  // =========================================================================
  // ÉRTESÍTÉSKÜLDŐ FUNKCIÓK (i18n Támogatással)
  // =========================================================================

  private createPayload(key: string, data?: any): string {
    return JSON.stringify({ key, data: data || {} });
  }

  async createTargetedNotification(userId: number, payloadString: string, tipus: string = 'INFO') {
    await this.prisma.notification.create({
      data: {
        userId: Number(userId),
        uzenet: payloadString,
        tipus,
        isRead: false,
        isDeleted: false
      }
    });
    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
  }

  async createAdminNotification(payloadString: string, tipus: string = 'INFO') {
    const admins = await this.prisma.user.findMany({
      where: { rang: 'ADMIN', isBanned: false },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        uzenet: payloadString,
        tipus,
        isRead: false,
        isDeleted: false
      })),
    });

    admins.forEach((a) => {
      this.events.emitUpdate('notifications_updated', { userId: a.id });
    });
  }

  async createGlobalNotification(payloadString: string, tipus: string = 'INFO', productId?: number) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let isDuplicate = false;

    try {
      const newPayload = JSON.parse(payloadString);
      const existing = await this.prisma.notification.findFirst({
        where: {
          productId: productId || undefined,
          letrehozva: { gte: sevenDaysAgo },
          uzenet: { contains: `"${newPayload.key}"` }
        },
      });
      if (existing) isDuplicate = true;
    } catch (e) {
      // Fallback
    }

    if (isDuplicate) return;

    const targetUsers = await this.prisma.user.findMany({
      where: { rang: { in: ['ADMIN', 'KEZELO'] }, isBanned: false },
      select: { id: true },
    });

    if (targetUsers.length === 0) return;

    await this.prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        uzenet: payloadString,
        tipus,
        productId: productId || null,
        isRead: false,
        isDeleted: false
      })),
    });

    targetUsers.forEach((u) => {
      this.events.emitUpdate('notifications_updated', { userId: u.id });
    });
  }

  // =========================================================================
  // KÉSZLET ÉS LEJÁRAT ELLENŐRZŐ FUNKCIÓK
  // =========================================================================

  private formatDate(date: Date): string {
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  async checkSingleProduct(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isDeleted: false },
      include: { batches: true }
    });

    if (!product) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalStock = product.batches.reduce((sum, b) => sum + b.mennyiseg, 0);

    if (totalStock === 0) {
      await this.createGlobalNotification(
        this.createPayload('outOfStock', { nev: product.nev }),
        'ERROR',
        product.id
      );
    } else if (totalStock <= product.minimumKeszlet) {
      await this.createGlobalNotification(
        this.createPayload('lowStock', { nev: product.nev, mennyiseg: totalStock, min: product.minimumKeszlet }),
        'WARNING',
        product.id
      );
    }

    for (const batch of product.batches) {
      if (!batch.lejarat || batch.mennyiseg === 0) continue;

      const expiryDate = new Date(batch.lejarat);
      expiryDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const formattedDate = this.formatDate(expiryDate);

      if (diffDays === 7 || diffDays === 2) {
        await this.createGlobalNotification(
          this.createPayload('expiringSoon', { nev: product.nev, parcella: batch.parcella, datum: formattedDate }),
          diffDays === 2 ? 'ERROR' : 'WARNING',
          product.id
        );
      } else if (diffDays < 0) {
        await this.createGlobalNotification(
          this.createPayload('expiredAlready', { nev: product.nev, parcella: batch.parcella, datum: formattedDate }),
          'ERROR',
          product.id
        );
      } else if (diffDays === 0) {
        await this.createGlobalNotification(
          this.createPayload('expiresToday', { nev: product.nev, parcella: batch.parcella }),
          'ERROR',
          product.id
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldDeletedNotifications() {
    this.logger.log('Szemétgyűjtő indítása: 7 napnál régebbi törölt értesítések eltávolítása...');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.notification.deleteMany({
      where: { isDeleted: true, deletedAt: { lte: sevenDaysAgo } }
    });
    if (result.count > 0) this.logger.log(`${result.count} db régi értesítés véglegesen törölve.`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiryAndStock() {
    this.logger.log('Napi globális készlet és lejárat ellenőrzés indítása...');
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false },
      select: { id: true }
    });
    
    for (const product of products) {
      await this.checkSingleProduct(product.id);
    }
  }
}
