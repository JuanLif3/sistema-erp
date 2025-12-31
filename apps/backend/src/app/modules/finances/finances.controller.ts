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

  // 👇 ACTUALIZADO: Lógica de fechas corregida para incluir todo el día de hoy
  @Get('history')
  getHistory(
    @Query('days') days?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string
  ) {
    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      // MODO RANGO PERSONALIZADO
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      // Ajustamos al final del día
      endDate.setHours(23, 59, 59, 999);
      // Ajustamos al inicio del día (opcional pero recomendable)
      startDate.setHours(0, 0, 0, 0);
    } else {
      // MODO PRESET (7 días, 30 días, etc.)
      const daysCount = days ? parseInt(days) : 30;
      
      endDate = new Date();
      // ¡CLAVE! Forzamos el final del día de hoy para no perder ventas por Timezone
      endDate.setHours(23, 59, 59, 999);

      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
      // Forzamos el inicio del día para tener barras completas
      startDate.setHours(0, 0, 0, 0);
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
    // También ajustamos aquí para consistencia
    endDate.setHours(23, 59, 59, 999); 
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    
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
    
    // El servicio ya maneja defaults, pero si vienen fechas, aseguramos el final del día
    if (end) end.setHours(23, 59, 59, 999);
    if (start) start.setHours(0, 0, 0, 0);

    const buffer = await this.financesService.generateReport(start, end);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=Reporte_Ventas.pdf',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}