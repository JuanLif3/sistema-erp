import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm'; 
import { AppModule } from './app/app.module';
import { User } from './app/modules/users/entities/user.entity'; // 👈 Importamos Entidad User
import { Company } from './app/modules/companies/entities/company.entity';
import * as bcrypt from 'bcrypt'; // 👈 Necesitamos bcrypt aquí para hashear manual

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const dataSource = app.get(DataSource); // Acceso directo a la BD
  
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // 👇 SCRIPT DE SEEDING CORREGIDO (Modo Dios / Repositorios Directos)
  const userRepo = dataSource.getRepository(User);     // 👈 Usamos Repo, no Service
  const companyRepo = dataSource.getRepository(Company);

  // Verificamos si hay usuarios (usando count para ser más eficientes)
  const usersCount = await userRepo.count();
  
  if (usersCount === 0) {
    Logger.log('⚠️ Base de datos vacía. Iniciando Seeding SaaS...', 'Bootstrap');
    
    // 1. Crear Empresa Matriz
    Logger.log('🏢 Creando Empresa Principal...', 'Bootstrap');
    const newCompany = companyRepo.create({
      name: 'Empresa Matriz (Admin)',
      rut: '99.999.999-9',
      isActive: true
    });
    const savedCompany = await companyRepo.save(newCompany);

    // 2. Crear Super Admin
    const adminEmail = configService.get<string>('ADMIN_EMAIL') || 'admin@sistema.com';
    const adminPassword = configService.get<string>('ADMIN_PASSWORD') || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10); // Hasheamos manual

    // 👇 ERROR 2 y 3 SOLUCIONADOS: Usamos save() directo, sin pasar por las reglas del Service
    const newAdmin = userRepo.create({
      fullName: 'Administrador Principal',
      email: adminEmail,
      password: hashedPassword,
      roles: ['admin', 'super-admin'],
      isActive: true,
      company: savedCompany // Vinculamos a la empresa creada arriba
    });
    
    await userRepo.save(newAdmin);
    
    Logger.log(`✅ Super Admin creado: ${adminEmail} (Empresa: ${savedCompany.name})`, 'Bootstrap');
  }
  // 👆 FIN DEL SCRIPT

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

bootstrap();