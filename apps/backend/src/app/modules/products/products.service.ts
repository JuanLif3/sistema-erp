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

  // 👇 1. CREAR: Asignamos la empresa automáticamente
  async create(createProductDto: CreateProductDto, user: any) {
    try {
      const product = this.productRepository.create({
        ...createProductDto,
        companyId: user.companyId, // 👈 ¡MAGIA! Se vincula a la Pyme del usuario
      });
      return await this.productRepository.save(product);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('El código SKU ya existe en tu inventario.');
      }
      throw error;
    }
  }

  // 👇 2. LISTAR: Solo devolvemos lo que es de la empresa del usuario
  findAll(
    activeOnly?: boolean, 
    lowStock?: boolean, 
    sortBy: string = 'createdAt', 
    order: 'ASC' | 'DESC' = 'DESC',
    user?: any // 👈 Recibimos el usuario
  ) {
    // El filtro base SIEMPRE incluye la empresa
    const where: any = { 
      companyId: user.companyId 
    };

    if (activeOnly) where.isActive = true;
    if (lowStock) where.stock = LessThanOrEqual(5);

    const orderConfig: any = {};
    if (sortBy) orderConfig[sortBy] = order;

    return this.productRepository.find({ where, order: orderConfig });
  }

  // 👇 3. BUSCAR UNO: Verificamos ID + Empresa
  async findOne(id: string, user: any) {
    const product = await this.productRepository.findOneBy({ 
      id, 
      companyId: user.companyId // 👈 Seguridad: Si el ID es de otra empresa, no lo encuentra
    });
    
    if (!product) throw new NotFoundException(`Producto no encontrado`);
    return product;
  }

  // 👇 4. ACTUALIZAR: Primero buscamos seguro, luego actualizamos
  async update(id: string, updateProductDto: UpdateProductDto, user: any) {
    // Paso 1: Verificar que el producto existe Y es mío
    // Reutilizamos nuestro método findOne seguro
    const product = await this.findOne(id, user); 

    // Paso 2: Mezclar los cambios y guardar
    this.productRepository.merge(product, updateProductDto);
    return this.productRepository.save(product);
  }

  // 👇 5. ELIMINAR: Solo si coincide ID y Empresa
  async remove(id: string, user: any) {
    try {
      // Usamos delete con condiciones múltiples
      const result = await this.productRepository.delete({ 
        id, 
        companyId: user.companyId // 👈 Seguridad Crítica
      });
      
      if (result.affected === 0) {
        throw new NotFoundException(`Producto no encontrado`);
      }
      return result;
    } catch (error: any) {
      if (error.code === '23503') {
        throw new BadRequestException('No se puede eliminar este producto porque tiene ventas asociadas. Desactívalo en su lugar.');
      }
      throw error;
    }
  }
}