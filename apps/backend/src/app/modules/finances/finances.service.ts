import { Injectable } from '@nestjs/common';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';

@Injectable()
export class FinancesService {
  create(createFinanceDto: CreateFinanceDto) {
    return 'This action adds a new finance';
  }

  findAll() {
    return `This action returns all finances`;
  }

  findOne(id: number) {
    return `This action returns a #${id} finance`;
  }

  update(id: number, updateFinanceDto: UpdateFinanceDto) {
    return `This action updates a #${id} finance`;
  }

  remove(id: number) {
    return `This action removes a #${id} finance`;
  }
}
