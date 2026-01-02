import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string; // Ej: "Panadería Don Juan"

  @Column('text', { unique: true })
  rut: string; // Identificador legal (opcional pero recomendado en Chile)

  @Column('bool', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relación: Una empresa tiene muchos usuarios
  @OneToMany(() => User, (user) => user.company)
  users: User[];
}