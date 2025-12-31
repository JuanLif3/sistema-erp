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

  // --- 1. RESUMEN FILTRABLE ---
  async getSummary(startDate?: Date, endDate?: Date) {
    const query = this.orderRepository.createQueryBuilder('order')
      .where('order.status = :status', { status: 'completed' });

    // Filtro de fecha si existe
    if (startDate && endDate) {
      query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const totalRevenueQuery = await query.select('SUM(order.total)', 'sum').getRawOne();
    const totalOrders = await query.getCount();

    // Promedio
    const revenue = Number(totalRevenueQuery?.sum || 0);
    const avgTicket = totalOrders > 0 ? revenue / totalOrders : 0;

    return {
      totalRevenue: revenue,
      totalOrders: totalOrders,
      avgTicket: avgTicket,
      lastUpdated: new Date()
    };
  }

  // --- 2. HISTORIAL FILTRABLE ---
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

  // --- 3. TOP PRODUCTOS FILTRABLE ---
  async getTopProducts(startDate?: Date, endDate?: Date) {
    const query = this.dataSource.getRepository(OrderItem)
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order') // Unimos con la orden para ver la fecha
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

  // --- 4. ÚLTIMAS TRANSACCIONES FILTRABLE ---
  async getRecentOrders(startDate?: Date, endDate?: Date) {
    // Si hay fechas usamos Between, si no, traemos las últimas 10 generales
    const where: any = { status: 'completed' };
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    return this.orderRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 15, // Mostramos hasta 15 en el reporte
      relations: ['user']
    });
  }

  // --- 5. GENERADOR DE PDF ---
  async generateReport(start?: Date, end?: Date): Promise<Buffer> {
    // Si no envían fechas, usamos por defecto el último mes
    const endDate = end || new Date();
    const startDate = start || new Date(new Date().setDate(endDate.getDate() - 30));

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => { /* empty */ });

    // Obtenemos datos filtrados
    const summary = await this.getSummary(startDate, endDate);
    const history = await this.getSalesHistory(startDate, endDate);
    const topProducts = await this.getTopProducts(startDate, endDate);
    const recentOrders = await this.getRecentOrders(startDate, endDate);

    // --- DISEÑO ---
    const primaryColor = '#1e3a8a';
    const secondaryColor = '#64748b';
    const lightBg = '#f1f5f9';

    // Header
    doc.rect(50, 45, 40, 40).fill(primaryColor);
    doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold').text('ERP', 56, 58);
    
    doc.fillColor(primaryColor).fontSize(20).text('REPORTE DE VENTAS', 110, 50);
    
    // 👇 MOSTRAMOS EL RANGO DE FECHAS SELECCIONADO
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica')
       .text(`Periodo: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 110, 75);

    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 400, 65, { align: 'right', width: 150 });

    doc.moveTo(50, 100).lineTo(550, 100).stroke(secondaryColor);

    // KPIs
    let y = 130;
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Resumen del Periodo', 50, y);
    y += 25;

    const drawCard = (x: number, title: string, value: string) => {
      doc.roundedRect(x, y, 155, 60, 5).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica').text(title.toUpperCase(), x + 15, y + 15);
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(value, x + 15, y + 30);
    };

    drawCard(50, 'Ingresos', `$${summary.totalRevenue.toLocaleString()}`);
    drawCard(220, 'Ventas', summary.totalOrders.toString());
    drawCard(390, 'Ticket Medio', `$${Math.round(summary.avgTicket).toLocaleString()}`);

    y += 80;

    // Tabla Productos
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Productos Más Vendidos', 50, y);
    y += 25;

    // Header Tabla
    doc.rect(50, y, 500, 20).fill(primaryColor);
    doc.fillColor('#fff').fontSize(9);
    doc.text('PRODUCTO', 60, y + 6);
    doc.text('CANTIDAD', 350, y + 6);
    doc.text('TOTAL', 450, y + 6);
    y += 20;

    // Body Tabla
    doc.font('Helvetica').fillColor('#334155');
    topProducts.forEach((p, i) => {
      doc.rect(50, y, 500, 20).fill(i % 2 === 0 ? '#fff' : lightBg);
      doc.fillColor('#334155');
      doc.text(p.name.substring(0, 40), 60, y + 6);
      doc.text(p.sold + ' un.', 350, y + 6);
      doc.text(`$${Number(p.revenue).toLocaleString()}`, 450, y + 6);
      y += 20;
    });

    y += 30;

    // Historial Diario (Si hay espacio)
    if (y < 600) {
        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Detalle de Ventas', 50, y);
        y += 25;
        doc.rect(50, y, 500, 20).fill(primaryColor);
        doc.fillColor('#fff').fontSize(9);
        doc.text('FECHA / HORA', 60, y + 6);
        doc.text('CLIENTE', 250, y + 6);
        doc.text('MONTO', 450, y + 6);
        y += 20;

        recentOrders.forEach((order, i) => {
            if (y > 720) return; // Evitar desborde simple
            doc.rect(50, y, 500, 20).fill(i % 2 === 0 ? '#fff' : lightBg);
            doc.fillColor('#334155');
            doc.text(new Date(order.createdAt).toLocaleString(), 60, y + 6);
            doc.text(order.user ? order.user.fullName : 'Cliente General', 250, y + 6);
            doc.text(`$${Number(order.total).toLocaleString()}`, 450, y + 6);
            y += 20;
        });
    }

    // Footer
    doc.fillColor('#999').fontSize(8).text('Fin del reporte.', 50, 750, { align: 'center' });
    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}