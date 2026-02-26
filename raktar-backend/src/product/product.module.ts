//raktar-backend/src/product/product.module.ts
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [AuditModule, NotificationModule],
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
})
export class ProductModule {}
