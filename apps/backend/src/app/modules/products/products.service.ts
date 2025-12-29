import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  findAll() {
    return this.productRepository.find({
      order: { createdAt: 'DESC' }, // Los más nuevos primero
      where: { isActive: true } // Solo mostramos los activos por defecto
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

  // Soft Delete (No borramos el dato, solo lo desactivamos para no romper historiales de ventas)
  async remove(id: string) {
    const product = await this.findOne(id);
    product.isActive = false;
    return this.productRepository.save(product);
  }
}