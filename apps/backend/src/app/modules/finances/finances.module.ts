import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { Order } from '../orders/entities/order.entity';
// 👇 1. Importar la entidad Expense
import { Expense } from '../expenses/entities/expense.entity'; 

@Module({
  imports: [
    // 👇 2. Agregar Expense al array
    TypeOrmModule.forFeature([Order, Expense]) 
  ],
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}