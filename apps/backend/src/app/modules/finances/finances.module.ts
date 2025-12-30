import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { Order } from '../orders/entities/order.entity'; // <--- Importante

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]), // <--- Conectamos la tabla de Órdenes
  ],
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}