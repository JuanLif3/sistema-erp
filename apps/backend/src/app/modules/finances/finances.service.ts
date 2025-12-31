import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import PDFDocument from 'pdfkit';

@Injectable()
export class FinancesService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private dataSource: DataSource
  ) {}

  // --- 1. RESUMEN GENERAL (Tarjetas) ---
  async getSummary() {
    const totalRevenueQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'sum')
      .where('order.status = :status', { status: 'completed' })
      .getRawOne();

    const totalOrders = await this.orderRepository.count({ where: { status: 'completed' } });

    // Pedidos de hoy (Desde las 00:00 hasta ahora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .andWhere('order.status = :status', { status: 'completed' })
      .getCount();

    return {
      totalRevenue: Number(totalRevenueQuery?.sum || 0),
      totalOrders: totalOrders,
      todayOrders: todayOrders,
      lastUpdated: new Date()
    };
  }

  // --- 2. HISTORIAL DE VENTAS (Gráfico) ---
  // Ahora acepta fechas exactas para ser compatible con el PDF
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

    return sales.map(item => ({
      date: item.date,
      total: Number(item.total)
    }));
  }

  // --- 3. TOP PRODUCTOS (Para el PDF) ---
  async getTopProducts(startDate: Date, endDate: Date) {
    return this.dataSource.getRepository(OrderItem)
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoinAndSelect('item.product', 'product')
      .select('product.name', 'name')
      .addSelect('product.sku', 'sku')
      .addSelect('SUM(item.quantity)', 'sold')
      .addSelect('SUM(item.quantity * item.priceAtPurchase)', 'revenue')
      .where('order.status = :status', { status: 'completed' })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.sku')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany();
  }

  // --- 4. GENERADOR DE PDF ---
  async generateReport(start?: Date, end?: Date): Promise<Buffer> {
    const endDate = end || new Date();
    const startDate = start || new Date(new Date().setDate(endDate.getDate() - 30));

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => { /* empty */ });

    // Datos
    const summary = await this.getSummary(); // General
    const history = await this.getSalesHistory(startDate, endDate); // Histórico filtrado
    const topProducts = await this.getTopProducts(startDate, endDate);

    // Diseño PDF
    const primaryColor = '#1e3a8a';
    
    // Encabezado
    doc.rect(50, 45, 40, 40).fill(primaryColor);
    doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold').text('ERP', 56, 58);
    doc.fillColor(primaryColor).fontSize(20).text('REPORTE DE VENTAS', 110, 50);
    doc.fillColor('#666').fontSize(10).font('Helvetica').text(`Periodo: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 110, 75);

    // Tabla Productos
    let y = 150;
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Top Productos', 50, y);
    y += 25;
    
    doc.rect(50, y, 500, 20).fill(primaryColor);
    doc.fillColor('#fff').fontSize(9).text('PRODUCTO', 60, y + 6).text('CANTIDAD', 350, y + 6).text('TOTAL', 450, y + 6);
    y += 20;

    doc.font('Helvetica').fillColor('#333');
    topProducts.forEach((p, i) => {
      doc.rect(50, y, 500, 20).fill(i % 2 === 0 ? '#fff' : '#f1f5f9');
      doc.fillColor('#333');
      doc.text(p.name.substring(0,40), 60, y + 6);
      doc.text(p.sold + ' un.', 350, y + 6);
      doc.text(`$${Number(p.revenue).toLocaleString()}`, 450, y + 6);
      y += 20;
    });

    doc.end();
    return new Promise((resolve) => resolve(Buffer.concat(buffers)));
  }


  async getSalesByCategory() {
    return this.dataSource.getRepository(OrderItem)
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .select('product.category', 'name') // Recharts prefiere 'name' y 'value'
      .addSelect('SUM(item.quantity * item.priceAtPurchase)', 'value')
      .where('order.status = :status', { status: 'completed' })
      .groupBy('product.category')
      .orderBy('value', 'DESC')
      .getRawMany();
  }

  // ... generateReport ...
}