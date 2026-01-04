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
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(Expense) private readonly expenseRepository: Repository<Expense>,
    private dataSource: DataSource
  ) {}

  // 1. RESUMEN (DASHBOARD) - CORREGIDO
  async getSummary(user: any, startDate?: Date, endDate?: Date) {
    const companyId = user.companyId;
    
    // A. Ingresos Totales (Filtros Globales)
    const query = this.orderRepository.createQueryBuilder('order')
      .where('order.status = :status', { status: 'completed' })
      .andWhere('order.companyId = :companyId', { companyId });

    if (startDate && endDate) {
      query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const totalRevenueQuery = await query.select('SUM(order.total)', 'sum').getRawOne();
    const totalOrders = await query.getCount();
    const revenue = Number(totalRevenueQuery?.sum || 0);
    const avgTicket = totalOrders > 0 ? revenue / totalOrders : 0;

    // B. Ventas HOY (Corregido con Zona Horaria Chile)
    const todayOrders = await this.orderRepository.createQueryBuilder('order')
      .where("order.status = 'completed'")
      .andWhere("order.companyId = :companyId", { companyId })
      // 👇 MAGIA AQUÍ: Convertimos la fecha de creación a Chile y la comparamos con 'HOY' en Chile
      .andWhere("DATE(order.createdAt AT TIME ZONE 'America/Santiago') = DATE(NOW() AT TIME ZONE 'America/Santiago')")
      .getCount();

    // C. Gastos
    const expenseQuery = this.expenseRepository.createQueryBuilder('expense')
      .where('expense.companyId = :companyId', { companyId });

    if (startDate && endDate) {
      expenseQuery.andWhere('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const totalExpensesQuery = await expenseQuery.select('SUM(expense.amount)', 'sum').getRawOne();
    const totalExpenses = Number(totalExpensesQuery?.sum || 0);

    const pendingRequests = await this.orderRepository.find({
      where: { cancellationStatus: 'pending', companyId },
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' }
    });

    return {
      totalRevenue: revenue, totalOrders, todayOrders, avgTicket, totalExpenses,
      netProfit: revenue - totalExpenses, pendingRequests, lastUpdated: new Date()
    };
  }

  // 2. GASTOS
  async getExpenses(user: any, page = 1, limit = 20, category?: string, startDate?: Date, endDate?: Date, search?: string) {
    const where: any = { companyId: user.companyId };
    if (category && category !== 'all') where.category = category;
    if (startDate && endDate) where.date = Between(startDate, endDate);
    if (search) where.description = Like(`%${search}%`);

    const [data, total] = await this.expenseRepository.findAndCount({
      where, order: { date: 'DESC' }, take: limit, skip: (page - 1) * limit,
    });
    return { data, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }

  async createExpense(data: any, user: any) {
    const expense = this.expenseRepository.create({ ...data, companyId: user.companyId });
    return this.expenseRepository.save(expense);
  }

  async updateExpense(id: string, data: any, user: any) {
    const expense = await this.expenseRepository.findOneBy({ id, companyId: user.companyId });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    Object.assign(expense, data);
    return this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string, user: any) {
    return this.expenseRepository.delete({ id, companyId: user.companyId });
  }

  // 3. GRÁFICOS - CORREGIDO
  async getSalesHistory(user: any, startDate: Date, endDate: Date) {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // 👇 Usamos TO_CHAR con la zona horaria correcta para agrupar por día
    const sales = await this.orderRepository.query(`
      SELECT 
        TO_CHAR("createdAt" AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD') as date, 
        SUM(total) as total
      FROM orders
      WHERE "companyId" = $1 
      AND status = 'completed'
      AND "createdAt" >= $2::date 
      AND "createdAt" <= $3::date + interval '1 day'
      GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD')
      ORDER BY date ASC
    `, [user.companyId, startStr, endStr]);

    return sales.map(item => ({ 
      date: item.date, 
      total: Number(item.total) 
    }));
  }

  async getTopProducts(user: any, startDate?: Date, endDate?: Date) {
    const query = this.dataSource.getRepository(OrderItem).createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoinAndSelect('item.product', 'product')
      .select(['product.name as name', 'product.sku as sku', 'SUM(item.quantity) as sold', 'SUM(item.quantity * item.priceAtPurchase) as revenue'])
      .where("order.status = 'completed'")
      .andWhere("order.companyId = :cid", { cid: user.companyId });

    if (startDate && endDate) query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    return query.groupBy('product.id').addGroupBy('product.name').addGroupBy('product.sku')
      .orderBy('revenue', 'DESC').limit(5).getRawMany();
  }

  async getSalesByCategory(user: any) {
    return this.dataSource.getRepository(OrderItem).createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .select(['product.category as name', 'SUM(item.quantity * item.priceAtPurchase) as value'])
      .where("order.status = 'completed'")
      .andWhere("order.companyId = :cid", { cid: user.companyId })
      .groupBy('product.category')
      .orderBy('value', 'DESC')
      .getRawMany();
  }

  // 4. SIMULADOR - CORREGIDO
  async simulateSales(user: any) {
    const orders = [];
    const today = new Date(); // Esto tomará la hora del servidor (UTC)
    
    // No necesitamos corregir mucho aquí porque al guardar 'new Date()', 
    // Postgres guarda en UTC. Lo importante es cómo LEEMOS esos datos (con AT TIME ZONE).
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Aleatoriedad para que no sea siempre igual
      date.setHours(Math.floor(Math.random() * 12) + 10); // Entre las 10 AM y 10 PM

      const dailyCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < dailyCount; j++) {
        orders.push(this.orderRepository.create({
          total: Math.floor(Math.random() * 50000) + 5000,
          status: 'completed',
          createdAt: date,
          companyId: user.companyId,
          user: { id: user.userId }
        }));
      }
    }
    await this.orderRepository.save(orders);
    return { message: 'Datos simulados exitosamente.' };
  }

  // 5. REPORTE PDF (Mantenemos tu corrección del reporte)
  async generateReport(user: any, start?: Date, end?: Date): Promise<Buffer> {
    const rawStart = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
    const rawEnd = end ? new Date(end) : new Date();

    const startString = rawStart.toISOString().split('T')[0];
    const endString = rawEnd.toISOString().split('T')[0];

    const startDate = new Date(`${startString}T00:00:00.000`);
    const endDate = new Date(`${endString}T23:59:59.999`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => { /* empty */ });

    // CARGAR DATOS
    const summary = await this.getSummary(user, startDate, endDate);
    const topProducts = await this.getTopProducts(user, startDate, endDate);
    
    // Categorías (con fechas corregidas)
    const categoriesData = await this.dataSource.getRepository(OrderItem)
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .select(['product.category as name', 'SUM(item.quantity * item.priceAtPurchase) as value', 'COUNT(product.id) as count'])
      .where("order.status = 'completed'")
      .andWhere("order.companyId = :cid", { cid: user.companyId })
      .andWhere("order.createdAt >= :start", { start: startDate }) 
      .andWhere("order.createdAt <= :end", { end: endDate })
      .groupBy('product.category')
      .orderBy('value', 'DESC')
      .getRawMany();

    // Todas las órdenes
    const allOrders = await this.orderRepository.find({
      where: {
        status: 'completed',
        companyId: user.companyId,
        createdAt: Between(startDate, endDate)
      },
      order: { createdAt: 'DESC' },
      relations: ['user', 'items']
    });

    // --- ESTILOS ---
    const primaryColor = '#1e3a8a';
    const accentColor = '#64748b';
    const lightBg = '#f1f5f9';
    let y = 50;

    // 1. ENCABEZADO
    doc.rect(0, 0, 600, 100).fill(primaryColor);
    doc.fillColor('#fff').fontSize(24).font('Helvetica-Bold').text('REPORTE DE VENTAS', 40, 35);
    // 👇 Corrección aquí para hora reporte en el PDF
    doc.fontSize(10).font('Helvetica').text(`Generado el: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 40, 65);
    
    const displayStart = startString.split('-').reverse().join('/');
    const displayEnd = endString.split('-').reverse().join('/');

    doc.fillColor('#fff').fontSize(12).text('Rango Seleccionado:', 350, 35, { align: 'right' });
    doc.font('Helvetica-Bold').text(`${displayStart} al ${displayEnd}`, 350, 50, { align: 'right' });

    y = 120;

    // 2. RESUMEN EJECUTIVO
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text('RESUMEN DEL PERIODO', 40, y);
    y += 25;

    const drawCard = (x: number, title: string, value: string, sub: string) => {
      doc.roundedRect(x, y, 125, 60, 5).fillAndStroke('#fff', '#e2e8f0');
      doc.fillColor(accentColor).fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 10, y + 10);
      doc.fillColor(primaryColor).fontSize(14).text(value, x + 10, y + 25);
      doc.fillColor(accentColor).fontSize(8).font('Helvetica').text(sub, x + 10, y + 45);
    };

    drawCard(40, 'Ventas Totales', `$${summary.totalRevenue.toLocaleString()}`, 'Ingresos Brutos');
    drawCard(175, 'Total Pedidos', summary.totalOrders.toString(), 'Transacciones');
    drawCard(310, 'Ticket Promedio', `$${Math.round(summary.avgTicket).toLocaleString()}`, 'Por venta');
    drawCard(445, 'Utilidad Neta', `$${summary.netProfit.toLocaleString()}`, 'Ingresos - Gastos');

    y += 80;

    // 3. SECCIÓN GRÁFICA
    const startYSection3 = y;
    
    // Top Productos
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Top 5 Productos', 40, y);
    y += 20;
    doc.rect(40, y, 250, 20).fill('#e2e8f0');
    doc.fillColor('#000').fontSize(8).text('PRODUCTO', 45, y + 6).text('INGRESO', 240, y + 6);
    y += 20;
    
    topProducts.forEach((p, i) => {
      doc.rect(40, y, 250, 20).fill(i % 2 === 0 ? '#fff' : lightBg);
      doc.fillColor('#333').text(p.name.substring(0, 30), 45, y + 6);
      doc.text(`$${Number(p.revenue).toLocaleString()}`, 240, y + 6);
      y += 20;
    });

    // Categorías
    let yRight = startYSection3;
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Ventas por Categoría', 310, yRight);
    yRight += 20;
    doc.rect(310, yRight, 240, 20).fill('#e2e8f0');
    doc.fillColor('#000').fontSize(8).text('CATEGORÍA', 315, yRight + 6).text('TOTAL', 500, yRight + 6);
    yRight += 20;

    categoriesData.forEach((c, i) => {
      doc.rect(310, yRight, 240, 20).fill(i % 2 === 0 ? '#fff' : lightBg);
      doc.fillColor('#333').text((c.name || 'Sin Categoría').substring(0, 25), 315, yRight + 6);
      doc.text(`$${Number(c.value).toLocaleString()}`, 500, yRight + 6);
      yRight += 20;
    });

    y = Math.max(y, yRight) + 30;

    // 4. LISTADO DETALLADO
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(`DETALLE DE TRANSACCIONES (${allOrders.length})`, 40, y);
    y += 20;

    const drawTableHeader = (currY: number) => {
      doc.rect(40, currY, 515, 20).fill(primaryColor);
      doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
      doc.text('FECHA / HORA', 45, currY + 6);
      doc.text('CLIENTE / VENDEDOR', 140, currY + 6);
      doc.text('ID VENTA', 280, currY + 6);
      doc.text('ITEMS', 380, currY + 6);
      doc.text('TOTAL', 490, currY + 6);
    };

    drawTableHeader(y);
    y += 20;

    doc.font('Helvetica').fontSize(8);

    allOrders.forEach((order, i) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
        drawTableHeader(y);
        y += 20;
      }

      const rowColor = i % 2 === 0 ? '#fff' : '#f8fafc';
      doc.rect(40, y, 515, 20).fill(rowColor);
      doc.fillColor('#334155');

      // Formato fecha local en la tabla
      // 👇 Corrección aquí para hora en la tabla del PDF
      const dateStr = new Date(order.createdAt).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) + ' ' + 
                      new Date(order.createdAt).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute:'2-digit'});
      
      const clientName = order.user ? order.user.fullName : 'Sistema';
      const itemCount = order.items ? order.items.length : 0;

      doc.text(dateStr, 45, y + 6);
      doc.text(clientName.substring(0, 25), 140, y + 6);
      doc.text(order.id.split('-')[0], 280, y + 6);
      doc.text(itemCount.toString(), 380, y + 6);
      doc.font('Helvetica-Bold').text(`$${Number(order.total).toLocaleString()}`, 490, y + 6);
      doc.font('Helvetica');

      y += 20;
    });

    doc.moveTo(40, y + 10).lineTo(555, y + 10).stroke('#e2e8f0');
    doc.fillColor('#94a3b8').fontSize(8).text('Fin del reporte.', 40, y + 20, { align: 'center' });

    doc.end();
    return new Promise((resolve) => resolve(Buffer.concat(buffers)));
  }
}