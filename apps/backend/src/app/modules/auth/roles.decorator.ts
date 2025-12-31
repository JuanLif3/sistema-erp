import { SetMetadata } from '@nestjs/common';

// Esta constante es la llave para leer los roles luego
export const ROLES_KEY = 'roles';

// Creamos el decorador @Roles('admin', 'user', etc)
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);