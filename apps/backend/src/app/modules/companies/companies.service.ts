import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private dataSource: DataSource,
  ) {}

  async createCompanyWithAdmin(data: any) {
    const { name, rut, adminName, adminEmail, adminPassword } = data;

    // Usamos una Transacción: Todo o Nada
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar RUT único
      const existing = await this.companyRepository.findOneBy({ rut });
      if (existing) throw new BadRequestException('El RUT ya existe');

      // 2. Crear Empresa
      const newCompany = queryRunner.manager.create(Company, { name, rut });
      const savedCompany = await queryRunner.manager.save(newCompany);

      // 3. Crear Dueño
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = queryRunner.manager.create(User, {
        fullName: adminName,
        email: adminEmail,
        password: hashedPassword,
        roles: ['admin'],
        isActive: true,
        company: savedCompany // 👈 Aquí se vinculan
      });
      await queryRunner.manager.save(newAdmin);

      await queryRunner.commitTransaction();
      return { message: 'Pyme creada exitosamente', company: savedCompany };

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
}