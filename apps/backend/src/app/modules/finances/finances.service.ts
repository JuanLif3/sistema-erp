import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
// Asegúrate de importar DataSource
import { DataSource } from 'typeorm'; 

@Injectable()
export class FinancesService {
  getSummary() {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private dataSource: DataSource // <--- Inyectamos esto para consultas crudas
  ) {}

  // ... (Tu método getSummary déjalo igual) ...

  // 👇 NUEVO MÉTODO PARA EL GRÁFICO
  async getSalesHistory(days: number) {
    // 1. Calcular la fecha de inicio (Hace 7, 30 o 365 días)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 2. Consulta SQL Mágica
    // Esta consulta agrupa por día y suma los totales
    const sales = await this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date') // Formato fecha limpia
      .addSelect("SUM(order.total)", 'total')
      .where("order.createdAt >= :startDate", { startDate })
      .andWhere("order.status = :status", { status: 'completed' })
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    // 3. Formatear para el Frontend
    return sales.map(item => ({
      date: item.date,
      total: Number(item.total) // Convertir de string a numero
    }));
  }
}