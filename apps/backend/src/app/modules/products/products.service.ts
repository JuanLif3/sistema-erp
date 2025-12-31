import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
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

  findAll(
    activeOnly?: boolean, 
    lowStock?: boolean, 
    sortBy: string = 'createdAt', 
    order: 'ASC' | 'DESC' = 'DESC'
  ) {
    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (lowStock) where.stock = LessThanOrEqual(5);

    const orderConfig: any = {};
    if (sortBy) orderConfig[sortBy] = order;

    return this.productRepository.find({ where, order: orderConfig });
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

  // 👇 ACTUALIZADO: ELIMINACIÓN FÍSICA (HARD DELETE)
  async remove(id: string) {
    try {
      // Intentamos borrar el registro de la base de datos
      const result = await this.productRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return result;
    } catch (error: any) {
      // Código '23503' en Postgres significa violación de llave foránea (Foreign Key Violation)
      // Esto pasa si intentas borrar un producto que ya está en la tabla 'order_items'
      if (error.code === '23503') {
        throw new BadRequestException('No se puede eliminar este producto porque ya tiene historial de ventas. Por favor, desactívalo en su lugar.');
      }
      throw error;
    }
  }
}