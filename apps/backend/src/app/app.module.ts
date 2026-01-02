import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Módulos
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FinancesModule } from './modules/finances/finances.module';
import { CategoriesModule } from './modules/categories/categories.module'; // 👈 1. IMPORTAR ESTO

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entidades
import { Expense } from './modules/expenses/entities/expense.entity';
import { User } from './modules/users/entities/user.entity';
import { Product } from './modules/products/entities/product.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { Category } from './modules/categories/entities/category.entity'; // 👈 2. IMPORTAR ESTO

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      // 👇 3. AGREGAR Category AQUI
      entities: [User, Product, Order, OrderItem, Expense, Category], 
      autoLoadEntities: true,
      synchronize: true,
      // dropSchema: true,
      ssl: true, // 👈 IMPORTANTE PARA NEON
  extra: {
    ssl: { rejectUnauthorized: false }, // 👈 NECESARIO PARA QUE NO FALLE EL CERTIFICADO
  },
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    FinancesModule,
    CategoriesModule, // 👈 4. AGREGAR EL MÓDULO AQUI
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}