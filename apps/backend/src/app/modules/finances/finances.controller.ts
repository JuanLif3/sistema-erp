import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinancesService } from './finances.service';
import { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('categories')
  getCategories() {
    return this.financesService.getSalesByCategory();
  }

  // 👇 NUEVO: Endpoint para el gráfico de Barras (Reutilizamos la lógica del PDF)
  @Get('top-products')
  getTopProducts() {
    // Por defecto traemos el último mes para el widget
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return this.financesService.getTopProducts(startDate, endDate);
  }

  @Get('summary')
  getSummary() {
    return this.financesService.getSummary();
  }

  // 👇 ARREGLADO: Convierte "days=7" a fechas reales para el gráfico
  @Get('history')
  getHistory(@Query('days') days: string) {
    const daysCount = days ? parseInt(days) : 7;
    
    const endDate = new Date(); // Hoy
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount); // Hoy menos X días

    return this.financesService.getSalesHistory(startDate, endDate);
  }

  // Endpoint para el PDF
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