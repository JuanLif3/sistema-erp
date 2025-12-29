import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- Importar
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity'; // <--- Importar Entidad

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // <--- ¡Clave!
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exportamos el servicio para que AuthModule lo use después
})
export class UsersModule {}