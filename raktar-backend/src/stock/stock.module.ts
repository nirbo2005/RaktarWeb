import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PrismaService } from 'src/prisma.service'; 
import { AuditModule } from '../audit/audit.module'; // Importáld be!

@Module({
  imports: [AuditModule], // Add hozzá az importokhoz!
  controllers: [StockController],
  providers: [StockService, PrismaService],
})
export class StockModule {}
