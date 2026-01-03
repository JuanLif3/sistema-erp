import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company])], // 👈 Registramos la entidad
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService] // Por si lo necesitamos fuera
})
export class CompaniesModule {}