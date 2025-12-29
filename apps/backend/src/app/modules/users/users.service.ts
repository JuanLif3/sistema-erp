import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
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

      // 1. Encriptar la contraseña
      const hashedPassword = bcrypt.hashSync(password, 10);

      // 2. Crear objeto usuario
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      // 3. Guardar en db
      await this.userRepository.save(user);

      // 4. Limpiar entorno (para no devolver el hash)
      delete user.password;
      return user;

    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('El correo ya esta registrado');
      } 
      throw new InternalServerErrorException('Error creando usuario');
    }
  }

  // Metodo auxiliar para el login
  async findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'password', 'email', 'roles', 'fullName'], // Aquí sí pedimos el password para compararlo
    });
  }

  findAll() {
    return this.userRepository.find();
  }
}
