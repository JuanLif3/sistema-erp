import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'completed' })
  status: string;

  // 👇 NUEVO CAMPO: Método de Pago
  @Column({ default: 'cash' }) 
  paymentMethod: string; // 'cash', 'card', 'transfer'

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => User, (user) => user.orders, { nullable: true })
  user: User;
}