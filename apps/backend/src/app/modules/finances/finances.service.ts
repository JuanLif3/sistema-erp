import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class FinancesService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private dataSource: DataSource
  ) {}

  // Calcula los totales para las tarjetas de arriba
  async getSummary() {
    const totalRevenueQuery = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'sum')
      .where('order.status = :status', { status: 'completed' })
      .getRawOne();

    const totalOrders = await this.orderRepository.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .getCount();

    return {
      totalRevenue: Number(totalRevenueQuery.sum || 0),
      totalOrders: totalOrders,
      todayOrders: todayOrders,
      lastUpdated: new Date()
    };
  }

  // Calcula el historial para el gráfico
  async getSalesHistory(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect("SUM(order.total)", 'total')
      .where("order.createdAt >= :startDate", { startDate })
      .andWhere("order.status = :status", { status: 'completed' })
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return sales.map(item => ({
      date: item.date,
      total: Number(item.total)
    }));
  }
}