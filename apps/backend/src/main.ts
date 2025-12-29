import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configurar prefijo global (para que las rutas sean /api/...)
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // 2. ACTIVAR CORS (¡Esto soluciona tu error rojo!) 🔓
  app.enableCors({
    origin: 'http://localhost:4200', // Solo permitimos al Frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();