//raktar-backend/src/notification/notification.module.ts
import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from 'src/events/events.gateway';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, EventsGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
