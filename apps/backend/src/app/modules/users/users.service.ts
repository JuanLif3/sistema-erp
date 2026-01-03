import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

async create(createUserDto: any, adminUser: any) {
    const existing = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existing) throw new BadRequestException('El correo ya está registrado en el sistema');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // Creamos la instancia
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      company: { id: adminUser.companyId }
    });
    
    // Guardamos
    const savedUser = await this.userRepository.save(newUser);
    
    // 👇 SOLUCIÓN: Usamos (savedUser as any) para callar a TypeScript
    const userResponse = { ...(savedUser as any) }; 
    
    // Ahora sí podemos borrar sin error
    delete userResponse.password;
    
    return userResponse;
  }

  // 👇 2. LISTAR EMPLEADOS: Solo los de MI empresa
  findAll(user: any) {
    return this.userRepository.find({
      where: { 
        company: { id: user.companyId } // 👈 FILTRO DE SEGURIDAD
      },
      order: { createdAt: 'DESC' }
    });
  }

  // 3. BUSCAR UNO (Para editar/borrar): Solo si es de MI empresa
  async findOne(id: string, user: any) {
    const foundUser = await this.userRepository.findOne({
      where: { 
        id,
        company: { id: user.companyId } // 👈 SEGURIDAD
      }
    });
    
    if (!foundUser) throw new NotFoundException('Usuario no encontrado');
    return foundUser;
  }

  // BUSCAR POR EMAIL (Para Login - Este no lleva companyId porque aun no sabemos quien es)
  async findOneByEmail(email: string) {
    return this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company') // 👈 Cargar la empresa también
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
  }

  // 4. ACTUALIZAR
  async update(id: string, updateUserDto: any, user: any) {
    // Primero verificamos que el usuario a editar pertenezca a mi empresa
    const userToUpdate = await this.findOne(id, user);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      delete updateUserDto.password;
    }

    Object.assign(userToUpdate, updateUserDto);
    return this.userRepository.save(userToUpdate);
  }

  // 5. ELIMINAR / DESACTIVAR
  async remove(id: string, user: any) {
    const userToDelete = await this.findOne(id, user); // Seguridad primero
    try {
        return await this.userRepository.remove(userToDelete);
    } catch (error) {
        // Si tiene ventas, mejor desactivar
        userToDelete.isActive = false;
        return await this.userRepository.save(userToDelete);
    }
  }
}