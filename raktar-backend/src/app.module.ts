import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { StockModule } from './stock/stock.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // A ConfigModule-t az imports lista elejére érdemes tenni
    ConfigModule.forRoot({
      isGlobal: true, // Ezzel a beállítással nem kell minden modulban külön importálni a ConfigModule-t
      envFilePath: '.env', // Megadjuk a környezeti változókat tartalmazó fájl útvonalát
    }),
    AuthModule,
    UserModule,
    StockModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
