import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(name: string) {
    // Verificar si ya existe (insensible a mayúsculas)
    const exists = await this.repo.createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name })
      .getOne();
      
    if (exists) throw new BadRequestException('Esta categoría ya existe');

    const category = this.repo.create({ name });
    return this.repo.save(category);
  }

  async remove(id: string) {
    return this.repo.delete(id);
  }
}