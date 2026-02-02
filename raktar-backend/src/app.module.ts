//app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }), StockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
