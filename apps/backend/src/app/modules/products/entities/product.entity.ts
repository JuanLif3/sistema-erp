import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('products')
@Unique(['sku', 'companyId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  sku: string; // Código único (ej: REF-001)

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 }) // Soporta precios como 10500.50
  price: number;

  @Column('int')
  stock: number; // Cantidad actual en inventario

  @Column('text')
  category: string; // Ej: "Electrónica", "Ropa"

  @Column('bool', { default: true })
  isActive: boolean;

  @Column('text', { nullable: true }) // Puede estar vacío si no tiene foto
  image: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  companyId: string; // 👈 LA LLAVE MAESTRA
}