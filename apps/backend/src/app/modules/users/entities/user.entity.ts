import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    email: string;

    @Column('text', { select: false })
    password: string;

    // 👇 CAMBIO AQUÍ: Agregamos un valor por defecto
    @Column('text', { default: 'Usuario Sistema' }) 
    fullName: string;

    @Column('text', { array: true, default: ['employee'] })
    roles: string[];

    @Column('bool', { default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];
}