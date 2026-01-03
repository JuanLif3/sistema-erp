import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  repo: any;
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>
  ) {}

  // Listar solo las mías
  findAll(user: any) {
    return this.categoryRepo.find({
      where: { companyId: user.companyId } // 👈 Filtro SaaS
    });
  }

  // Crear con dueño
  async create(createCategoryDto: any, user: any) {
    const category = this.categoryRepo.create({
      ...createCategoryDto,
      companyId: user.companyId // 👈 Tatuamos la empresa
    });
    return this.categoryRepo.save(category);
  }

  // Buscar una (seguro)
  async findOne(id: string, user: any) {
    const category = await this.categoryRepo.findOne({
      where: { id, companyId: user.companyId }
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async remove(id: string, user: any) {
    return this.repo.delete(id);
  }
}