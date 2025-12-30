import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- Importar
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { Order } from '../orders/entities/order.entity'; // <--- Importar Entidad Order

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]), // <--- ¡Vital! Registramos Order para poder consultarla
  ],
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}