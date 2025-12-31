import { Controller, Get, Post, Body, UseGuards, Query, Delete, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    // Ya no enviamos req.user.userId. La venta es anónima.
    return this.ordersService.create(createOrderDto);
  }

@Get()
  findAll(@Query('status') status?: string) { // Recibe ?status=cancelled
    return this.ordersService.findAll(status);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
  
}