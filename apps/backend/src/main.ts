import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { UsersService } from './app/modules/users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración Global
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // 👇 SCRIPT DE SEEDING (Crear Admin si no existe)
  const usersService = app.get(UsersService);
  const users = await usersService.findAll();
  
  if (users.length === 0) {
    Logger.log('⚠️ Base de datos vacía. Creando Super Admin...', 'Bootstrap');
    
    await usersService.create({
      fullName: 'Administrador Principal',
      email: 'admin@sistema.com',     // 👈 TU CORREO DE ADMIN
      password: 'admin123',           // 👈 TU CONTRASEÑA DE INICIO
      roles: ['admin'],
      isActive: true
    });
    
    Logger.log('✅ Super Admin creado: admin@sistema.com / admin123', 'Bootstrap');
  }
  // 👆 FIN DEL SCRIPT

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

bootstrap();