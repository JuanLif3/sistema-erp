import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
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
    return this.ordersService.findAll(status, parseInt(page), 20, sortBy, order as 'ASC'|'DESC', paymentMethod);
  }

  // 👇 SOLO ADMIN PUEDE BORRAR DIRECTAMENTE
  @Delete(':id')
  @Roles('admin') 
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  // 👇 EMPLEADOS SOLICITAN BORRADO
  @Post(':id/request-cancellation')
  requestCancellation(@Param('id') id: string, @Body('reason') reason: string) {
    return this.ordersService.requestCancellation(id, reason);
  }

  // 👇 ADMIN APRUEBA O RECHAZA
  @Roles('admin')
  @Post(':id/resolve-cancellation')
  resolveCancellation(@Param('id') id: string, @Body('approved') approved: boolean) {
    return this.ordersService.resolveCancellation(id, approved);
  }
}