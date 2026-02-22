import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module'; 

@Module({
  imports: [
    AuditModule,
    NotificationModule, 
  ],
  controllers: [BatchController],
  providers: [
    BatchService, 
    PrismaService
  ],
  exports: [BatchService],
})
export class BatchModule {}
