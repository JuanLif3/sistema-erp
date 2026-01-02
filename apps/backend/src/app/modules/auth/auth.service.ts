import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  // 1. Validar usuario y contraseña
  async validateUser(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    // Buscamos al usuario por email
    const user = await this.usersService.findOneByEmail(email);

    // Si el usuario existe y la contraseña coincide...
    if (user && bcrypt.compareSync(password, user.password)) {
      
      // 👇 BLOQUE DE SEGURIDAD NUEVO
      if (!user.isActive) {
        // Si está inactivo, le prohibimos la entrada aunque la contraseña esté bien
        throw new UnauthorizedException('Tu cuenta ha sido desactivada. Contacte al administrador.');
      }

      const { password, ...result } = user; // Quitamos el password
      return result; // Retornamos usuario limpio
    }
    
    return null; // Credenciales incorrectas
  }

  // 2. Generar el token (login)
  async login(user: any) {
    const payload = { 
      username: user.email, 
      sub: user.id, 
      roles: user.roles 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles
      }
    };
  }
}