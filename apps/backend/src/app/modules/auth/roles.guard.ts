import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Leemos qué roles requiere este endpoint (ej: ['admin'])
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no requiere roles específicos, dejamos pasar a todos
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtenemos el usuario desde la petición (lo puso ahí el AuthGuard/Passport)
    const { user } = context.switchToHttp().getRequest();

    // Si no hay usuario (no está logueado), denegamos
    if (!user) {
      throw new ForbiddenException('Usuario no identificado');
    }

    // 3. Verificamos si el usuario tiene ALGUNO de los roles requeridos
    // Asumimos que user.roles es un array string[], ej: ['admin', 'employee']
    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    
    if (!hasRole) {
        throw new ForbiddenException('No tienes permisos suficientes (Roles)');
    }

    return true;
  }
}