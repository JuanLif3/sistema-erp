import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      
      // Encriptar contraseña antes de guardar
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El correo electrónico ya está registrado.');
      }
      throw error;
    }
  }

  findAll() {
    return this.userRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  // 👇 MÉTODO CRÍTICO CORREGIDO
  async findOneByEmail(email: string) {
    return this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // <--- ESTO ARREGLA EL LOGIN (Trae el pass oculto)
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    
    // Si viene password, la encriptamos de nuevo
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    this.userRepository.merge(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    user.isActive = false; // Soft Delete
    return this.userRepository.save(user);
  }
}