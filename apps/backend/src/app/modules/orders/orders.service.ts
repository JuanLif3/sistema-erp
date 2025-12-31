import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity'; // 👈 Importar User

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private dataSource: DataSource
  ) {}

  // 👇 ACTUALIZADO: Ahora recibe 'currentUser'
  async create(createOrderDto: CreateOrderDto, currentUser: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscamos al vendedor en la BD usando el ID del token
      const seller = await queryRunner.manager.findOne(User, { where: { id: currentUser.userId } });
      if (!seller) throw new Error('Usuario vendedor no encontrado');

      const order = new Order();
      order.total = 0;
      order.status = 'completed';
      order.paymentMethod = createOrderDto.paymentMethod || 'cash';
      
      // 👇 ASIGNACIÓN CLAVE: Guardamos quién hizo la venta
      order.user = seller; 
      
      order.items = [];

      let calculatedTotal = 0;

      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.findOne(Product, { where: { id: itemDto.productId } });
        
        if (!product) throw new Error(`Producto ${itemDto.productId} no encontrado`);
        if (product.stock < itemDto.quantity) throw new Error(`Stock insuficiente para ${product.name}`);

        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        orderItem.priceAtPurchase = product.price;
        
        calculatedTotal += Number(product.price) * itemDto.quantity;
        order.items.push(orderItem);
      }

      order.total = calculatedTotal;
      
      const savedOrder = await queryRunner.manager.save(Order, order);
      
      for (const item of order.items) {
        item.order = savedOrder;
        await queryRunner.manager.save(OrderItem, item);
        delete (item as any).order; 
      }

      await queryRunner.commitTransaction();
      return savedOrder;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    status?: string, 
    page: number = 1, 
    limit: number = 20,
    sortBy: string = 'createdAt', 
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    paymentMethod?: string
  ) {
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;

    const [data, total] = await this.orderRepository.findAndCount({
      where: whereClause,
      // 👇 Ya traíamos la relación 'user', así que el historial lo mostrará automático
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
      relations: ['items', 'items.product', 'user'] 
    });
  }

// 3. CANCELACIÓN REAL (Lógica existente modificada para limpiar estado)
  async cancelOrder(id: string) {
    const order = await this.orderRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product'] 
    });

    if (!order) throw new Error('Orden no encontrada');
    if (order.status === 'cancelled') throw new Error('Ya está cancelada');

    // Devolver Stock
    for (const item of order.items) {
      if (item.product) {
        item.product.stock += item.quantity;
        await this.dataSource.getRepository(Product).save(item.product);
      }
    }

    order.status = 'cancelled';
    order.cancellationStatus = 'approved'; // Marcamos como aprobado
    return this.orderRepository.save(order);
  }

  // 1. SOLICITAR CANCELACIÓN (Empleado)
  async requestCancellation(id: string, reason: string) {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new Error('Orden no encontrada');
    
    order.cancellationStatus = 'pending';
    order.cancellationReason = reason;
    return this.orderRepository.save(order);
  }

  // 2. RESOLVER SOLICITUD (Admin)
  async resolveCancellation(id: string, approved: boolean) {
    if (approved) {
      // Si aprueba, ejecutamos la cancelación real
      return this.cancelOrder(id); 
    } else {
      // Si rechaza, solo cambiamos el estado
      const order = await this.orderRepository.findOneBy({ id });
      order.cancellationStatus = 'rejected'; // O vuelve a 'none' si prefieres limpiar
      return this.orderRepository.save(order);
    }
  }

  
}