import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { AuditModule } from './audit/audit.module';
import { BatchModule } from './batch/batch.module';
import { NotificationModule } from './notification/notification.module';
import { EventsModule } from './events/events.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    ProductModule,
    AuditModule,
    BatchModule,
    NotificationModule,
    EventsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
