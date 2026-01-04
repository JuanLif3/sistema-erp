import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly mailerService: MailerService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email); // Esto ahora trae la company gracias al paso 1

    // 1. Validar que el usuario exista
    if (!user) return null;

    // 2. Validar contraseña
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return null;

    // 3. Validar si el usuario mismo está activo (despido individual)
    if (!user.isActive) {
      throw new UnauthorizedException('Tu usuario ha sido desactivado.');
    }

    // 👇 4. VALIDACIÓN DE EMPRESA SUSPENDIDA (EL FIX)
    // Si tiene empresa Y la empresa NO está activa -> Bloqueo total
    if (user.company && !user.company.isActive) {
       throw new UnauthorizedException('El servicio de su empresa está suspendido. Contacte a soporte.');
    }

    // ... quitar password y retornar
    const { password, ...result } = user;
    return result;
  }

  // 2. Generar el token (login)
  async login(user: any) {
    const payload = { 
      username: user.email, 
      sub: user.id, 
      roles: user.roles,
      companyId: user.companyId
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

  async requestPasswordReset(email: string) {
    const user = await this.userRepo.findOneBy({ email });
    if (!user) throw new NotFoundException('Correo no encontrado');

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await this.userRepo.save(user);

    const resetLink = `http://localhost:4200/reset-password?token=${token}`;
    
    // 👇 ENVÍO REAL
    try {
      await this.mailerService.sendMail({
        to: email, // El correo del usuario
        subject: 'Recuperación de Contraseña - Sistema ERP',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #1e3a8a;">Solicitud de cambio de contraseña</h2>
            <p>Hola <strong>${user.fullName}</strong>,</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
            <a href="${resetLink}" style="background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Restablecer Contraseña</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Si no solicitaste esto, ignora este correo. El enlace expira en 1 hora.</p>
          </div>
        `,
      });
      return { message: 'Correo enviado correctamente' };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Error enviando el correo. Intenta nuevamente.');
    }
  }

  // 👇 2. RESTABLECER CONTRASEÑA
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findOneBy({ resetPasswordToken: token });
    
    if (!user) throw new BadRequestException('Token inválido');
    if (user.resetPasswordExpires < new Date()) throw new BadRequestException('El token ha expirado');

    // Actualizar contraseña
    user.password = await bcrypt.hash(newPassword, 10);
    
    // Limpiar token para que no se pueda reusar
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await this.userRepo.save(user);

    return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }
}