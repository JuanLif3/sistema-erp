import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import * as bcrypt from 'bcrypt'; // Usamos el import correcto
import { User } from '../users/entities/user.entity';

@Injectable()
export class CompaniesService {
  // Eliminamos la variable 'companyRepo' que causaba el error
  
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>, // Este es el repositorio real
    private dataSource: DataSource,
  ) {}

  // 1. LISTAR PARA SUPER ADMIN
  async findAllForSuperAdmin() {
    // ⚠️ CORRECCIÓN: Usamos this.companyRepository (no companyRepo)
    return this.companyRepository.query(`
      SELECT c.id, c.name, c.rut, c."isActive", c."createdAt", COUNT(u.id) as "usersCount"
      FROM companies c
      LEFT JOIN users u ON u."companyId" = c.id
      GROUP BY c.id, c.name, c.rut, c."isActive", c."createdAt"
      ORDER BY c."createdAt" DESC
    `);
  }

  // 2. CREAR EMPRESA + ADMIN
  async createCompanyWithAdmin(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // A. Crear Empresa
      const company = this.companyRepository.create({
        name: data.companyName,
        rut: data.companyRut,
        isActive: true
      });
      // Guardamos usando el queryRunner para que sea parte de la transacción
      const savedCompany = await queryRunner.manager.save(company);

      // B. Crear Usuario Admin
      const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

      // Usamos la Entidad User importada, no un string
      const user = queryRunner.manager.create(User, {
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

  // 3. BLOQUEAR / DESBLOQUEAR
  async toggleStatus(id: string) {
    // ⚠️ CORRECCIÓN: Usamos this.companyRepository
    const company = await this.companyRepository.findOneBy({ id });
    if (!company) throw new Error('Empresa no encontrada');
    
    company.isActive = !company.isActive;
    return this.companyRepository.save(company);
  }
}