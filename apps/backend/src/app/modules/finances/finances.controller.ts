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

  // 👇 ESTE ERA EL QUE FALLABA
  @Get('history')
  getHistory(@Query('days') days: string) {
    const daysCount = days ? parseInt(days) : 7;
    
    // Convertimos "días" a un rango de fechas real
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    // Ahora sí llamamos al servicio con Fechas, como le gusta
    return this.financesService.getSalesHistory(startDate, endDate);
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
      'Content-Disposition': `attachment; filename=Reporte_Financiero.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}