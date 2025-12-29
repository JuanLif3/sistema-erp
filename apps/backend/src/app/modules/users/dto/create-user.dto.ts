import { IsEmail, IsString, MinLength, IsArray, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, { message: 'El correo no es valido' })
    email: string;

    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @IsString()
    fullName: string;

    @IsOptional()
    @IsArray()
    roles?: string[];
}
