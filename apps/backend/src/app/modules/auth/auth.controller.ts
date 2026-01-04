import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Request } from '@nestjs/common'; // <--- Nuevos imports
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport'; // <--- Importante

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // 👇 CAMBIO AQUÍ: Pasamos email y password por separado
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas o cuenta suspendida');
    }
    
    return this.authService.login(user);
  }

  // NUEVO ENDPOINT PROTEGIDO
  @UseGuards(AuthGuard('jwt')) // <--- El guardia de seguridad
  @Get('profile')
  getProfile(@Request() req) {
    // Si llegamos aquí, el token es válido
    return {
      mensaje: "¡Entraste a la zona VIP!",
      usuario_decodificado: req.user
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}