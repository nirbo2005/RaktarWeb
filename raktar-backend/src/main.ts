import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, ForbiddenException } from '@nestjs/common';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from 'src/common/logging.interceptor';

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
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/,
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
        callback(new ForbiddenException(`Nem engedélyezett CORS origin: ${origin}`));
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

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const config = new DocumentBuilder()
    .setTitle('RaktárWeb API')
    .setDescription('RaktárWeb hivatalos backend API dokumentációja')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Adj meg egy érvényes JWT tokent',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend fut a következő porton: ${port}`);
}
void bootstrap();