import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  // Quitamos el userId obligatorio de los argumentos
  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items } = createOrderDto;
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {
        // Usamos lock pesimista para evitar que dos personas compren el ultimo item a la vez
        const product = await queryRunner.manager.findOne(Product, { 
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' } // Bloquea el producto mientras se vende
        });

        if (!product) throw new NotFoundException(`Producto no encontrado`);
        
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para: ${product.name}`);
        }

        // 1. Descontar Stock
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        // 2. Preparar Detalle
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = item.quantity;
        orderItem.priceAtPurchase = product.price;
        orderItems.push(orderItem);

        totalAmount += Number(product.price) * item.quantity;
      }

      // 3. Crear Orden (SIN USUARIO)
      const order = new Order();
      order.items = orderItems;
      order.total = totalAmount;

      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      return savedOrder;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(status?: string) { // Modificamos para filtrar opcionalmente
    const whereClause = status ? { status } : {}; // Si no hay status, trae todo (o ajusta según prefieras)
    
    return this.orderRepository.find({
      where: whereClause,
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async cancelOrder(id: string) {
    const order = await this.orderRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product'] 
    });

    if (!order) throw new Error('Orden no encontrada');
    if (order.status === 'cancelled') throw new Error('La orden ya está cancelada');

    // 1. Devolver Stock (IMPORTANTE)
    for (const item of order.items) {
      item.product.stock += item.quantity;
      await this.dataSource.getRepository(Product).save(item.product);
    }

    // 2. Cambiar estado
    order.status = 'cancelled';
    return this.orderRepository.save(order);
  }
}