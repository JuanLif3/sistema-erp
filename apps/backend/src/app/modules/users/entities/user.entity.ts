import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    email: string;

    @Column('text', { select: false })
    // select: false es VITAL. Evita que la contraseña viaje 
    // al frontend cuando se pida la lista de usuarios.
    password: string;

    @Column('text')
    fullName: string;

    @Column('text', { array: true, default: ['employee'] })
    roles: string[];

    @Column('bool', { default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
