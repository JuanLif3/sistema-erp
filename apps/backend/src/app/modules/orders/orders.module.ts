import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- Importante
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

// Importamos las 3 entidades que usa el servicio
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
@Module({
  imports: [
    // 👇 ¡AQUÍ ESTÁ LA SOLUCIÓN! 
    // Tienes que registrar TODAS las entidades que inyectas en el servicio
    TypeOrmModule.forFeature([Order, OrderItem, Product]), 
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}