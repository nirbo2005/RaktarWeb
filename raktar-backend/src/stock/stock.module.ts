import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PrismaService } from 'src/prisma.service'; 

@Module({
  controllers: [StockController],
  providers: [StockService, PrismaService],
})
export class StockModule {}
