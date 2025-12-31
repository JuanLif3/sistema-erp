import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinancesService } from './finances.service';
import { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('summary')
  getSummary() {
    return this.financesService.getSummary();
  }

  // 👇 ACTUALIZADO: Acepta Días O Fechas específicas
  @Get('history')
  getHistory(
    @Query('days') days?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string
  ) {
    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      // MODO RANGO: Usamos las fechas que envió el usuario
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      // Ajustamos al final del día para incluir todas las ventas de la fecha final
      endDate.setHours(23, 59, 59, 999);
    } else {
      // MODO RÁPIDO: Usamos los días (7, 30, etc.)
      const daysCount = days ? parseInt(days) : 30;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
    }

    return this.financesService.getSalesHistory(startDate, endDate);
  }

  @Get('categories')
  getCategories() {
    return this.financesService.getSalesByCategory();
  }

  @Get('top-products')
  getTopProducts() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return this.financesService.getTopProducts(startDate, endDate);
  }

  @Get('simulate')
  simulate() {
    return this.financesService.simulateSales();
  }

  @Get('report')
  async getReport(
    @Res() res: Response, 
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    const buffer = await this.financesService.generateReport(start, end);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=Reporte_Ventas.pdf',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}