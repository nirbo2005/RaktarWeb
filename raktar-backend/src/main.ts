import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS beállítás - Hozzáadtam az összes lehetséges címedet
  app.enableCors({
    origin: [
      'https://raktar-web.vercel.app', 
      'https://raktar-web-git-main-nirbo2005s-projects.vercel.app',
      'https://raktar-6t7wbe395-nirbo2005s-projects.vercel.app',
      'https://olahnorbert.hu',
      'http://localhost:5173' 
    ],
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

  // --- MVC/EJS RÉSZEKET TÖRÖLTEM, MERT API-T ÉPÍTÜNK ---

  // KRITIKUS: A Rendernek a process.env.PORT kell!
  const port = process.env.PORT || 3000;
  
  // A '0.0.0.0' kötelező, hogy a Render kívülről is lássa a portot
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
