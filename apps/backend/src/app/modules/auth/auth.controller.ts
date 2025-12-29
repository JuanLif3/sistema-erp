import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Request } from '@nestjs/common'; // <--- Nuevos imports
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport'; // <--- Importante

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');
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
}