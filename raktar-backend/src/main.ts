//raktar-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://raktar-web.vercel.app',
        'https://raktar-web-git-main-nirbo2005s-projects.vercel.app',
        'https://raktar-6t7wbe395-nirbo2005s-projects.vercel.app',
        'https://olahnorbert.hu',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        /^http:\/\/192\.168\.1\.\d{1,3}:5173$/,
      ];

      if (
        !origin ||
        allowedOrigins.some((allowed) =>
          typeof allowed === 'string'
            ? allowed === origin
            : allowed.test(origin),
        )
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend fut a következő porton: ${port}`);
}
void bootstrap();
