import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsGateway
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
        userId: Number(userId) 
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
        isRead: false 
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
        isRead: true 
      }
    });

    this.events.emitUpdate('notifications_updated', { userId: Number(userId) });
    return result;
  }

  /**
   * JAVÍTOTT: Globális értesítés szigorú duplikáció-szűréssel és tranzakcióval
   */
  async createGlobalNotification(uzenet: string, tipus: string = 'INFO') {
    
    
    const recentTime = new Date(Date.now() - 10 * 60 * 1000);
    const isDuplicate = await this.prisma.notification.findFirst({
      where: {
        uzenet,
        letrehozva: { gte: recentTime }
      }
    });

    if (isDuplicate) {
      this.logger.debug(`Spam szűrő megállította: ${uzenet}`);
      return;
    }

    const targetUsers = await this.prisma.user.findMany({
      where: { 
        rang: { in: ['ADMIN', 'KEZELO'] },
        isBanned: false 
      },
      select: { id: true }
    });

    if (targetUsers.length === 0) return;

    
    await this.prisma.$transaction(async (tx) => {
      const notifications = targetUsers.map(u => ({
        userId: u.id,
        uzenet,
        tipus,
        isRead: false
      }));

      await tx.notification.createMany({ data: notifications });
    });
    
    
    
    targetUsers.forEach(u => {
      this.events.emitUpdate('notifications_updated', { userId: u.id });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkInventoryLevels() {
    this.logger.log('Napi készlet-ellenőrzés indítása...');
    
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false },
      include: { batches: true },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const product of products) {
      const total = product.batches.reduce((sum, b) => sum + b.mennyiseg, 0);
      
      if (total < product.minimumKeszlet / 2) {
        await this.createGlobalNotification(
          `KRITIKUS KÉSZLET: ${product.nev} (${total} db) a minimum fele alá esett!`,
          'ALERT'
        );
      }
      
    }
  }
}
