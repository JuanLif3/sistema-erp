import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard) // 🔒 Seguridad Base
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // Pasamos req.user para vincular la venta a la empresa
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get()
  findAll(
    @Request() req, // 👈 1. Inyectamos el usuario (contiene companyId)
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('order') order: string = 'DESC',
    @Query('paymentMethod') paymentMethod?: string
  ) {
    // 👇 2. Pasamos el usuario AL SERVICIO junto con los filtros
    return this.ordersService.findAll(
      req.user, 
      status, 
      parseInt(page), 
      20, // Limit por defecto
      sortBy, 
      order as 'ASC'|'DESC', 
      paymentMethod
    );
  }

  // 👇 Obtener una orden específica (Falta en tu código, pero es necesaria)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user);
  }

  // 👇 SOLO ADMIN PUEDE BORRAR DIRECTAMENTE
  @Delete(':id')
  @Roles('admin') 
  cancel(@Param('id') id: string, @Request() req) {
    // Pasamos req.user para asegurar que el admin borra SU propia orden
    return this.ordersService.cancelOrder(id, req.user);
  }

  // 👇 EMPLEADOS SOLICITAN BORRADO
  @Post(':id/request-cancellation')
  requestCancellation(@Param('id') id: string, @Body('reason') reason: string, @Request() req) {
    return this.ordersService.requestCancellation(id, reason, req.user);
  }

  // 👇 ADMIN APRUEBA O RECHAZA
  @Roles('admin')
  @Post(':id/resolve-cancellation')
  resolveCancellation(
    @Param('id') id: string, 
    @Body('approved') approved: boolean, 
    @Request() req
  ) {
    return this.ordersService.resolveCancellation(id, approved, req.user);
  }
}