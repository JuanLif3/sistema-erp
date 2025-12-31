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
    @Query('page') page: string = '1',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('order') order: string = 'DESC',
    @Query('paymentMethod') paymentMethod?: string // <--- RECIBIMOS EL DATO
  ) {
    return this.ordersService.findAll(
      status, 
      parseInt(page), 
      20, 
      sortBy,
      order as 'ASC' | 'DESC',
      paymentMethod // <--- LO PASAMOS AL SERVICIO
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