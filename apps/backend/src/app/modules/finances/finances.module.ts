import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity'; // <--- Importante

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}