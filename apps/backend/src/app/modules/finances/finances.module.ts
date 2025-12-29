import { Module } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';

@Module({
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}
