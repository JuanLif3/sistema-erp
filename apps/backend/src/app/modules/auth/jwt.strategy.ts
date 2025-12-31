import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // 1. Extraer el token del Header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 2. Rechazar si expiró
      // 3. Usar la misma clave secreta que usamos para firmar
      secretOrKey: configService.get<string>('JWT_SECRET') || 'ClaveSecretaSuperDificil',
    });
  }

  // 4. Si el token es válido, esto añade el usuario a la "request"
async validate(payload: any) {
    // Lo que retornes aquí se inyecta en 'request.user'
    return { 
        userId: payload.sub, 
        username: payload.username, 
        roles: payload.roles // 👈 ¡ASEGÚRATE QUE ESTO ESTÉ AQUÍ!
    };
  }
}