import { Injectable, NotFoundException } from '@nestjs/common';
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
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  findAll() {
    return this.productRepository.find({
      order: { createdAt: 'DESC' },
      where: { isActive: true } // Solo mostramos los activos por defecto
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  // 👇 ACTUALIZAR PRODUCTO
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    this.productRepository.merge(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  // 👇 ELIMINAR (Soft Delete)
  async remove(id: string) {
    const product = await this.findOne(id);
    product.isActive = false; // Lo marcamos como inactivo
    return await this.productRepository.save(product);
  }
}