import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { AuthGuard } from '@nestjs/passport';

// ... otros imports

@UseGuards(AuthGuard('jwt'))
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('summary')
  getSummary() {
    return this.financesService.getSummary();
  }

  // 👇 NUEVA RUTA: /api/finances/history?days=30
  @Get('history')
  getHistory(@Query('days') days: string) {
    // Si no envían nada, por defecto mostramos 7 días
    const daysCount = days ? parseInt(days) : 7;
    return this.financesService.getSalesHistory(daysCount);
  }
}