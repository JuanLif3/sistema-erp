import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Like } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import PDFDocument from 'pdfkit';

@Injectable()
export class FinancesService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private dataSource: DataSource
  ) {}

  // ===========================================================================
  // 1. RESUMEN FINANCIERO (Ventas, Gastos, Solicitudes)
  // ===========================================================================
  async getSummary(startDate?: Date, endDate?: Date) {
    // A. LÓGICA DE VENTAS (INGRESOS)
    const query = this.orderRepository.createQueryBuilder('order')
      .where('order.status = :status', { status: 'completed' });

    if (startDate && endDate) {
      query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const totalRevenueQuery = await query.select('SUM(order.total)', 'sum').getRawOne();
    const totalOrders = await query.getCount();
    const revenue = Number(totalRevenueQuery?.sum || 0);
    const avgTicket = totalOrders > 0 ? revenue / totalOrders : 0;

    // Ventas de HOY (Rango completo 00:00 a 23:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Esto evita problemas de zona horaria entre Node y Postgres
    const todayOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where("order.status = 'completed'")
      .andWhere("DATE(order.createdAt) = CURRENT_DATE") 
      .getCount();

    // B. LÓGICA DE GASTOS (EGRESOS)
    const expenseQuery = this.expenseRepository.createQueryBuilder('expense');
    
    if (startDate && endDate) {
      expenseQuery.where('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const totalExpensesQuery = await expenseQuery.select('SUM(expense.amount)', 'sum').getRawOne();
    const totalExpenses = Number(totalExpensesQuery?.sum || 0);

    // C. SOLICITUDES DE CANCELACIÓN PENDIENTES
    const pendingRequests = await this.orderRepository.find({
      where: { cancellationStatus: 'pending' },
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' }
    });

    // RETORNO COMBINADO
    return {
      totalRevenue: revenue,
      totalOrders: totalOrders,
      todayOrders: todayOrders,
      avgTicket: avgTicket,
      totalExpenses: totalExpenses,
      netProfit: revenue - totalExpenses,
      pendingRequests: pendingRequests,
      lastUpdated: new Date()
    };
  }

  // ===========================================================================
  // 2. GESTIÓN DE GASTOS (CRUD + Filtros + Paginación)
  // ===========================================================================
  async getExpenses(
    page: number = 1, 
    limit: number = 20, 
    category?: string, 
    startDate?: Date, 
    endDate?: Date,
    search?: string
  ) {
    const where: any = {};

    if (category && category !== 'all') where.category = category;
    if (startDate && endDate) where.date = Between(startDate, endDate);
    if (search) where.description = Like(`%${search}%`);

    const [data, total] = await this.expenseRepository.findAndCount({
      where,
      order: { date: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async createExpense(data: { description: string, amount: number, category: string }) {
    const expense = this.expenseRepository.create(data);
    return this.expenseRepository.save(expense);
  }

  async updateExpense(id: string, data: Partial<Expense>) {
    const expense = await this.expenseRepository.findOneBy({ id });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    Object.assign(expense, data);
    return this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string) {
    return this.expenseRepository.delete(id);
  }

  // ===========================================================================
  // 3. REPORTES Y GRÁFICOS (Helpers)
  // ===========================================================================

  async getSalesHistory(startDate: Date, endDate: Date) {
    const sales = await this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect("SUM(order.total)", 'total')
      .where("order.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
      .andWhere("order.status = :status", { status: 'completed' })
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return sales.map(item => ({ date: item.date, total: Number(item.total) }));
  }

  async getTopProducts(startDate?: Date, endDate?: Date) {
    const query = this.dataSource.getRepository(OrderItem)
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoinAndSelect('item.product', 'product')
      .select('product.name', 'name')
      .addSelect('product.sku', 'sku')
      .addSelect('SUM(item.quantity)', 'sold')
      .addSelect('SUM(item.quantity * item.priceAtPurchase)', 'revenue')
      .where('order.status = :status', { status: 'completed' });

    if (startDate && endDate) {
      query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.sku')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany();
  }

  async getSalesByCategory() {
    return this.dataSource.getRepository(OrderItem)
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .select('product.category', 'name')
      .addSelect('SUM(item.quantity * item.priceAtPurchase)', 'value')
      .where('order.status = :status', { status: 'completed' })
      .groupBy('product.category')
      .orderBy('value', 'DESC')
      .getRawMany();
  }

  // Helper para el reporte PDF
  async getAllOrdersForReport(startDate: Date, endDate: Date) {
    return this.orderRepository.find({
      where: {
        status: 'completed',
        createdAt: Between(startDate, endDate)
      },
      order: { createdAt: 'DESC' },
      relations: ['user']
    });
  }

  // Simulador (Opcional)
  async simulateSales() {
    const orders: Order[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dailyCount = Math.floor(Math.random() * 8); 
      for (let j = 0; j < dailyCount; j++) {
        const randomTotal = Math.floor(Math.random() * 145000) + 5000;
        orders.push(this.orderRepository.create({
          total: randomTotal, status: 'completed', createdAt: date
        }));
      }
    }
    await this.orderRepository.save(orders);
    return { message: 'Datos simulados.' };
  }

  // ===========================================================================
  // 4. GENERADOR DE PDF MAESTRO
  // ===========================================================================
  async generateReport(start?: Date, end?: Date): Promise<Buffer> {
    const endDate = end || new Date();
    const startDate = start || new Date(new Date().setDate(endDate.getDate() - 30));

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => { /* empty */ });

    // --- CARGAR DATOS ---
    const summary = await this.getSummary(startDate, endDate);
    const topProducts = await this.getTopProducts(startDate, endDate);
    const allOrders = await this.getAllOrdersForReport(startDate, endDate);

    // --- ESTILOS ---
    const primaryColor = '#1e3a8a';
    const secondaryColor = '#64748b';
    const lightBg = '#f1f5f9';

    // 1. ENCABEZADO
    doc.rect(50, 45, 40, 40).fill(primaryColor);
    doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold').text('ERP', 56, 58);
    
    doc.fillColor(primaryColor).fontSize(20).text('REPORTE DE VENTAS', 110, 50);
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica')
       .text(`Periodo: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 110, 75);

    doc.text(`Total Registros: ${allOrders.length}`, 400, 65, { align: 'right', width: 150 });
    doc.moveTo(50, 100).lineTo(550, 100).stroke(secondaryColor);

    // 2. KPIS
    let y = 130;
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Resumen del Periodo', 50, y);
    y += 25;

    const drawCard = (x: number, title: string, value: string) => {
      doc.roundedRect(x, y, 155, 60, 5).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica').text(title.toUpperCase(), x + 15, y + 15);
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(value, x + 15, y + 30);
    };

    drawCard(50, 'Ventas Totales', `$${summary.totalRevenue.toLocaleString()}`);
    drawCard(220, 'Pedidos Totales', summary.totalOrders.toString());
    drawCard(390, 'Ticket Promedio', `$${Math.round(summary.avgTicket).toLocaleString()}`);
    
    y += 70;
    drawCard(50, 'Total Gastos', `$${summary.totalExpenses.toLocaleString()}`);
    
    const profitColor = summary.netProfit >= 0 ? primaryColor : '#ef4444';
    doc.roundedRect(220, y, 155, 60, 5).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor(secondaryColor).fontSize(9).font('Helvetica').text('UTILIDAD NETA', 235, y + 15);
    doc.fillColor(profitColor).fontSize(16).font('Helvetica-Bold').text(`$${summary.netProfit.toLocaleString()}`, 235, y + 30);

    y += 80;

    // 3. TOP PRODUCTOS
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Top 5 Productos Más Vendidos', 50, y);
    y += 25;

    doc.rect(50, y, 500, 20).fill(primaryColor);
    doc.fillColor('#fff').fontSize(9);
    doc.text('PRODUCTO', 60, y + 6).text('UNIDADES', 350, y + 6).text('TOTAL', 450, y + 6);
    y += 20;

    doc.font('Helvetica').fillColor('#334155');
    topProducts.forEach((p, i) => {
      doc.rect(50, y, 500, 20).fill(i % 2 === 0 ? '#fff' : lightBg);
      doc.fillColor('#334155');
      doc.text(p.name.substring(0, 40), 60, y + 6);
      doc.text(p.sold + ' un.', 350, y + 6);
      doc.text(`$${Number(p.revenue).toLocaleString()}`, 450, y + 6);
      y += 20;
    });

    y += 40;

    // 4. LISTADO DE PEDIDOS
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(`Detalle de Pedidos (${allOrders.length})`, 50, y);
    y += 25;

    const drawOrderHeader = (yPos: number) => {
      doc.rect(50, yPos, 500, 20).fill(primaryColor);
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold');
      doc.text('FECHA', 60, yPos + 6);
      doc.text('CLIENTE', 200, yPos + 6);
      doc.text('ID VENTA', 350, yPos + 6);
      doc.text('MONTO', 450, yPos + 6);
    };

    drawOrderHeader(y);
    y += 20;

    doc.font('Helvetica').fontSize(9);
    
    allOrders.forEach((order, i) => {
      if (y > 720) {
        doc.addPage();
        y = 50; // 👈 ¡AQUÍ ESTABA EL ERROR! (Ya corregido)
        drawOrderHeader(y);
        y += 20;
      }

      doc.rect(50, y, 500, 20).fill(i % 2 === 0 ? '#fff' : lightBg);
      doc.fillColor('#334155');
      
      const dateStr = new Date(order.createdAt).toLocaleDateString() + ' ' + new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const clientName = order.user ? order.user.fullName : 'Cliente General';

      doc.text(dateStr, 60, y + 6);
      doc.text(clientName.substring(0, 25), 200, y + 6);
      doc.text(order.id.split('-')[0], 350, y + 6);
      doc.text(`$${Number(order.total).toLocaleString()}`, 450, y + 6);
      y += 20;
    });

    doc.fillColor('#999').fontSize(8).text('Fin del reporte generado por ERP Pro.', 50, 750, { align: 'center' });
    doc.end();

    return new Promise((resolve) => resolve(Buffer.concat(buffers)));
  }
}