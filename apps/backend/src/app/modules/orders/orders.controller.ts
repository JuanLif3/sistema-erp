import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common'; // Agregamos Query
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  // 👇 ACTUALIZADO: Recibe Query Params
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('sortBy') sortBy = 'createdAt', // 'createdAt' | 'total'
    @Query('order') order = 'DESC'         // 'ASC' | 'DESC'
  ) {
    return this.ordersService.findAll(
      status, 
      parseInt(page), 
      20, // Límite fijo de 20 como pediste
      sortBy,
      order as 'ASC' | 'DESC'
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}