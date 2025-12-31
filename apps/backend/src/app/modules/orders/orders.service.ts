import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private dataSource: DataSource
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = new Order();
      order.total = 0;
      order.status = 'completed'; // Aseguramos estado por defecto
      order.items = [];

      let calculatedTotal = 0;

      // 1. Validar Stock y Calcular Total
      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.findOne(Product, { where: { id: itemDto.productId } });
        
        if (!product) throw new Error(`Producto ${itemDto.productId} no encontrado`);
        if (product.stock < itemDto.quantity) throw new Error(`Stock insuficiente para ${product.name}`);

        // Restar Stock
        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        // Crear Item
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        orderItem.priceAtPurchase = product.price;
        
        calculatedTotal += Number(product.price) * itemDto.quantity;
        order.items.push(orderItem);
      }

      order.total = calculatedTotal;
      
      // 2. Guardar Orden (Para obtener ID)
      const savedOrder = await queryRunner.manager.save(Order, order);
      
      // 3. Guardar Items vinculados
      for (const item of order.items) {
        item.order = savedOrder; // <--- AQUÍ SE CREA EL CICLO
        await queryRunner.manager.save(OrderItem, item);
        
        // 👇 LA SOLUCIÓN: Romper el ciclo antes de devolver el JSON
        // Eliminamos la referencia 'order' del item en memoria (no en BD)
        delete (item as any).order; 
      }

      await queryRunner.commitTransaction();
      return savedOrder; // Ahora devolvemos el objeto limpio sin ciclos

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- Paginación y Ordenamiento (Ya implementado) ---
  async findAll(
    status?: string, 
    page: number = 1, 
    limit: number = 20,
    sortBy: string = 'createdAt', 
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) {
    const whereClause = status ? { status } : {};
    
    const [data, total] = await this.orderRepository.findAndCount({
      where: whereClause,
      relations: ['items', 'items.product', 'user'],
      order: { [sortBy]: sortOrder },
      take: limit,
      skip: (page - 1) * limit
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    return this.orderRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product'] 
    });
  }

  async cancelOrder(id: string) {
    const order = await this.orderRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product'] 
    });

    if (!order) throw new Error('Orden no encontrada');
    if (order.status === 'cancelled') throw new Error('La orden ya está cancelada');

    // Devolver Stock
    for (const item of order.items) {
      if (item.product) {
        item.product.stock += item.quantity;
        await this.dataSource.getRepository(Product).save(item.product);
      }
    }

    order.status = 'cancelled';
    return this.orderRepository.save(order);
  }
}