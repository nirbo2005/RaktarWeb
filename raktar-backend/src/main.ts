//main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'node:path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // 🔑 FONTOS: transform: true kell, hogy a DTO-kban a @Type(() => Date) működjön
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,      // opcionális: csak DTO-ban lévő mezőket engedjük
      forbidNonWhitelisted: true, // opcionális: ismeretlen mezőt tiltsuk
    }),
  );

  app.useStaticAssets(path.join(__dirname, '..', '..', 'public'));
  app.setBaseViewsDir(path.join(__dirname, '..', '..', 'views'));

  app.setViewEngine('ejs');

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
