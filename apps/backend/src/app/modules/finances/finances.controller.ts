import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, Res } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('expenses')
  getExpenses(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('search') search: string,
    @Request() req // 👈 Inyectar usuario
  ) {
    return this.financesService.getExpenses(
      req.user, // 👈 Pasar usuario
      parseInt(page),
      parseInt(limit),
      category,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      search
    );
  }

  @Post('expenses')
  createExpense(@Body() body: any, @Request() req) {
    return this.financesService.createExpense(body, req.user); // 👈 Pasar usuario
  }

  @Patch('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.financesService.updateExpense(id, body, req.user); // 👈 Pasar usuario
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string, @Request() req) {
    return this.financesService.deleteExpense(id, req.user); // 👈 Pasar usuario
  }

  @Get('summary')
  getSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    return this.financesService.getSummary(
      req.user, 
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('history')
  getSalesHistory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    // Definimos fechas por defecto si no vienen
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.financesService.getSalesHistory(req.user, start, end);
  }

  @Get('categories')
  getCategories(@Request() req) {
    return this.financesService.getSalesByCategory(req.user);
  }

  @Get('top-products')
  getTopProducts(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    return this.financesService.getTopProducts(
        req.user, 
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
    );
  }

  @Get('simulate')
  simulate(@Request() req) {
    return this.financesService.simulateSales(req.user);
  }

  @Get('report')
  async generateReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
    @Request() req
  ) {
    const buffer = await this.financesService.generateReport(
        req.user,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Reporte_Financiero.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}