import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request } from '@nestjs/common'; // 👈 Importar Request
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) { // 👈 Inyectamos req
    // req.user viene del Token (gracias a JwtStrategy) y trae { userId, username, roles }
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('order') order: string = 'DESC',
    @Query('paymentMethod') paymentMethod?: string
  ) {
    return this.ordersService.findAll(
      status, 
      parseInt(page), 
      20, 
      sortBy,
      order as 'ASC' | 'DESC',
      paymentMethod
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