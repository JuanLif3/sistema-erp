import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity'; // 👈 1. IMPORTAR

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'completed' })
  status: string;

  @Column({ default: 'cash' }) 
  paymentMethod: string;

  @Column({ default: 'none' }) 
  cancellationStatus: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => User, (user) => user.orders, { nullable: true })
  user: User;

  // 👇 2. AGREGAR ESTO (Es obligatorio para que funcione el SaaS)
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column('uuid')
  companyId: string; 
}