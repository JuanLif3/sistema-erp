import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity'; // <--- IMPORTANTE

@Module({
  imports: [
    // Registramos ambas entidades para que el servicio pueda usarlas
    TypeOrmModule.forFeature([Order, OrderItem]), 
  ],
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}