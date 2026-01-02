import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  // 1. CREAR USUARIO (CRUD)
  async create(createUserDto: any) {
    const existing = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existing) throw new BadRequestException('El correo ya está registrado');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({ ...createUserDto, password: hashedPassword });
    return this.userRepository.save(user);
  }

  // 2. LISTAR TODOS (CRUD)
  findAll() {
    return this.userRepository.find({ order: { createdAt: 'DESC' } });
  }

  // 3. BUSCAR POR ID (Para CRUD y Relaciones)
  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // 👇 4. BUSCAR POR EMAIL (NECESARIO PARA AUTH/LOGIN)
  // Este es el método que te faltaba y causaba el error
  async findOneByEmail(email: string) {
    return this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // Importante: Traer password para validar
      .getOne();
  }

  // 5. ACTUALIZAR (CRUD)
  async update(id: string, updateUserDto: any) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Si viene password, la hasheamos
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      delete updateUserDto.password; // No sobreescribir con vacío
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

async remove(id: string) {
    try {
      return await this.userRepository.delete(id);
    } catch (error) {
      if (error.code === '23503') {
        // Si no se puede borrar, lo desactivamos
        return this.update(id, { isActive: false } as any);
      }
      throw error;
    }
  }
}