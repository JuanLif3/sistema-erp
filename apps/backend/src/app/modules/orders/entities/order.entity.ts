import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // CAMBIO AQUÍ: nullable: true. 
  // La venta puede existir sin que nadie firme el documento.
  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'completed' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}