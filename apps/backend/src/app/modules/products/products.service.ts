import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm'; // 👈 IMPORTANTE: LessThanOrEqual
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      return await this.productRepository.save(product);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('El código SKU ya existe en otro producto');
      }
      throw error;
    }
  }

  // 👇 ACTUALIZADO: Soporta filtros y ordenamiento
  findAll(
    activeOnly?: boolean, 
    lowStock?: boolean, 
    sortBy: string = 'createdAt', 
    order: 'ASC' | 'DESC' = 'DESC'
  ) {
    const where: any = {};
    
    if (activeOnly) where.isActive = true;
    // Si piden stock bajo, filtramos productos con 5 o menos unidades
    if (lowStock) where.stock = LessThanOrEqual(5);

    const orderConfig: any = {};
    if (sortBy) {
        orderConfig[sortBy] = order;
    }

    return this.productRepository.find({
      where: where,
      order: orderConfig
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
    });

    if (!product) throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    return this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    product.isActive = false;
    return this.productRepository.save(product);
  }
}