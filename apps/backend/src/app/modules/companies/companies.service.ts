import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CompaniesService {
  companyRepo: any;
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private dataSource: DataSource,
  ) {}

  async createCompanyWithAdmin(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // A. Crear Empresa
      const company = this.companyRepo.create({
        name: data.companyName,
        rut: data.companyRut,
        isActive: true
      });
      const savedCompany = await queryRunner.manager.save(company);

      // B. Crear Usuario Admin para esa empresa
      // Importante: Hashear password aquí o en el entity listener
      // Asumiremos que usas bcrypt aquí para asegurar
      const bcrypt = require('bcrypt'); 
      const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

      const user = queryRunner.manager.create('User', { // Usamos string 'User' o importa la entidad User
        fullName: data.adminName,
        email: data.adminEmail,
        password: hashedPassword,
        roles: ['admin'], 
        company: savedCompany,
        companyId: savedCompany.id,
        isActive: true
      });
      
      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      return { message: 'Empresa creada exitosamente', company: savedCompany };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.companyRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllForSuperAdmin() {
    return this.companyRepo.query(`
      SELECT c.id, c.name, c.rut, c."isActive", c."createdAt", COUNT(u.id) as "usersCount"
      FROM companies c
      LEFT JOIN users u ON u."companyId" = c.id
      GROUP BY c.id
      ORDER BY c."createdAt" DESC
    `);
  }

  // 3. Bloquear / Desbloquear Empresa
  async toggleStatus(id: string) {
    const company = await this.companyRepo.findOneBy({ id });
    if (!company) throw new Error('Empresa no encontrada');
    
    company.isActive = !company.isActive; // Invertir estado
    return this.companyRepo.save(company);
  }
  
}