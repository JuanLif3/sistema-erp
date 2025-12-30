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

    // Buscamos al usuario por email (incluyendo su password encriptada)
    const user = await this.usersService.findOneByEmail(email);

    // Si el usuario existe y la contraseña coincide...
    if (user && bcrypt.compareSync(password, user.password)) {
      const { password, ...result } = user; // Quitamos el password del objeto
      return result; // Devolvemos el usuario limpio
    }
    return null;
  }

      // 2. Generar el token (login)
    async login(user: any) {
    // Incluimos los roles en el payload del token y en la respuesta
    const payload = { 
      username: user.email, 
      sub: user.id, 
      roles: user.roles // <--- ESTO ES CRUCIAL
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles // <--- También lo devolvemos en plano para el frontend
      }
    };
  }
}
