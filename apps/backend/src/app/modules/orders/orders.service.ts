import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  // 1. CREAR VENTA (SaaS)
  async create(createOrderDto: CreateOrderDto, user: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const itemsToSave = [];

      for (const itemDto of createOrderDto.items) {
        // Validar que el producto sea de MI empresa
        const product = await queryRunner.manager.findOne(Product, {
          where: { 
            id: itemDto.productId, 
            companyId: user.companyId 
          }
        });

        if (!product) throw new BadRequestException(`Producto ${itemDto.productId} no encontrado o no pertenece a tu empresa`);
        if (product.stock < itemDto.quantity) throw new BadRequestException(`Stock insuficiente para ${product.name}`);

        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        
        // 👇 CORRECCIÓN AQUÍ: Usar 'priceAtPurchase' en lugar de 'price'
        orderItem.priceAtPurchase = product.price; 
        
        itemsToSave.push(orderItem);
        totalAmount += product.price * itemDto.quantity;
      }

      const order = this.orderRepo.create({
        total: totalAmount,
        user: { id: user.userId }, 
        companyId: user.companyId, // 👈 Ahora esto funcionará porque actualizamos la entidad
        items: itemsToSave,
        status: 'completed'
      });

      const savedOrder = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return savedOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 2. LISTAR VENTAS (Solución error 'sortOrder' y parámetro user)
  async findAll(
    user: any,
    status?: string,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order: 'ASC' | 'DESC' = 'DESC',
    paymentMethod?: string
  ) {
    const where: any = { 
      companyId: user.companyId // 👈 Filtro SaaS
    };
    
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    // Usamos findAndCount para obtener datos + total
    const [data, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['items', 'items.product', 'user'],
      order: { 
        [sortBy]: order 
      },
      take: limit,
      skip: (page - 1) * limit
    });

    // 👇 Retornamos estructura compatible con el Frontend
    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }
  // 3. BUSCAR UNA (Solución error TS2554)
  async findOne(id: string, user: any) {
    const order = await this.orderRepo.findOne({
      where: { 
        id, 
        companyId: user.companyId // 👈 Seguridad: Solo veo lo mío
      },
      relations: ['items', 'items.product', 'user']
    });

    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  // 4. CANCELAR ORDEN (Admin - Borrado físico o lógico)
  async cancelOrder(id: string, user: any) {
    // 1. Buscamos la orden con sus items y productos
    const order = await this.orderRepo.findOne({
      where: { id, companyId: user.companyId },
      relations: ['items', 'items.product']
    });

    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.status === 'cancelled') throw new BadRequestException('El pedido ya está anulado');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Devolver Stock al Inventario
      for (const item of order.items) {
        if (item.product) {
          // Incrementamos el stock
          await queryRunner.manager.increment(
            Product, 
            { id: item.product.id }, 
            'stock', 
            item.quantity
          );
        }
      }

      // 3. Cambiar estado a 'cancelled' (Anulación lógica)
      order.status = 'cancelled';
      order.cancellationStatus = 'approved'; // Marcamos como aprobado explícitamente
      
      const savedOrder = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return savedOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 5. SOLICITAR CANCELACIÓN (Empleado)
  async requestCancellation(id: string, reason: string, user: any) {
    const order = await this.findOne(id, user);
    
    // IMPORTANTE: NO cambiamos 'status'. El status sigue siendo 'completed'
    // para que aparezca en la lista de ventas, pero con una marca pendiente.
    order.cancellationStatus = 'pending'; 
    order.cancellationReason = reason;
    
    return this.orderRepo.save(order);
  }
  // 6. RESOLVER CANCELACIÓN (Admin)
  async resolveCancellation(id: string, approved: boolean, user: any) {
    const order = await this.findOne(id, user); // Busca incluso si es de otro usuario (dentro de la misma empresa)
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (approved) {
        // A) SI EL ADMIN APRUEBA:
        // 1. Devolver Stock
        for (const item of order.items) {
           if (item.product) {
             await queryRunner.manager.increment(Product, { id: item.product.id }, 'stock', item.quantity);
           }
        }
        // 2. Cambiar estado principal a Cancelado
        order.status = 'cancelled';
        order.cancellationStatus = 'approved';
      } else {
        // B) SI EL ADMIN RECHAZA (Mantiene la venta):
        order.status = 'completed'; // Se mantiene completada
        order.cancellationStatus = 'rejected'; // Quitamos la marca de pendiente
      }
      
      const saved = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();
      return saved;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}