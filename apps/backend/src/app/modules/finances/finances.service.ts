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

  // 1. RESUMEN
  async getSummary(user: any, startDate?: Date, endDate?: Date) {
    const companyId = user.companyId;
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

    // Ventas HOY
    const todayOrders = await this.orderRepository.createQueryBuilder('order')
      .where("order.status = 'completed'")
      .andWhere("order.companyId = :companyId", { companyId })
      .andWhere("DATE(order.createdAt) = CURRENT_DATE")
      .getCount();

    // Gastos
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

  // 3. GRÁFICOS
  async getSalesHistory(user: any, startDate: Date, endDate: Date) {
    // Convertimos fechas a string simple YYYY-MM-DD para evitar problemas de horas
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const sales = await this.orderRepository.query(`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date, 
        SUM(total) as total
      FROM orders
      WHERE "companyId" = $1 
      AND status = 'completed'
      AND "createdAt" >= $2::date 
      AND "createdAt" <= $3::date + interval '1 day' -- 👈 Truco para incluir el día final completo
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `, [user.companyId, startStr, endStr]);

    // Convertimos el total a número (Postgres lo devuelve como string)
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

  // 4. SIMULADOR (Corregido para SaaS)
  async simulateSales(user: any) {
    const orders = [];
    const today = new Date();
    for (let i = 0; i < 15; i++) { // Solo 15 días para no saturar
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dailyCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < dailyCount; j++) {
        orders.push(this.orderRepository.create({
          total: Math.floor(Math.random() * 50000) + 5000,
          status: 'completed',
          createdAt: date,
          companyId: user.companyId, // 👈 Importante: Simular para MI empresa
          user: { id: user.userId }
        }));
      }
    }
    await this.orderRepository.save(orders);
    return { message: 'Datos simulados exitosamente.' };
  }

  // 5. PDF (Simplificado para brevedad)
  async generateReport(user: any, start?: Date, end?: Date): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => { /* empty */ });
    
    doc.fontSize(20).text(`Reporte Financiero (ID Empresa: ${user.companyId.slice(0,8)})`, { align: 'center' });
    doc.end();
    return new Promise((resolve) => resolve(Buffer.concat(buffers)));
  }
}