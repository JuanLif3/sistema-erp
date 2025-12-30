import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
// Importa tus módulos (Nx suele crear alias, pero usaremos rutas relativas por seguridad ahora)
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FinancesModule } from './modules/finances/finances.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';

@Module({
  imports: [
    // 1. Cargar variables de entorno (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Conexión Global a Neon (PostgreSQL)
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // Lee la URL de tu .env
      autoLoadEntities: true, // Carga las entidades (User, Product, etc) automáticamente
      synchronize: true, // ⚠️ Crea las tablas solas (Genial para desarrollo)
      ssl: {
        rejectUnauthorized: false,
      },
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // 3. Módulos de tu ERP
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    FinancesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}