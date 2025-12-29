import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- Importar
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity'; // <--- Importar Entidad
import { AuthModule } from '../auth/auth.module'; // <--- Importar Auth si queremos proteger rutas

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]), // <--- REGISTRAR ENTIDAD
    AuthModule 
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Exportamos para que 'Orders' pueda descontar stock
})
export class ProductsModule {}