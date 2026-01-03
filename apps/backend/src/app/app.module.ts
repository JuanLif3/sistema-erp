import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Módulos Existentes
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FinancesModule } from './modules/finances/finances.module';
import { CategoriesModule } from './modules/categories/categories.module';

// 👇 1. IMPORTAR EL MÓDULO DE COMPAÑÍAS
import { CompaniesModule } from './modules/companies/companies.module'; 

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entidades
import { Expense } from './modules/expenses/entities/expense.entity';
import { User } from './modules/users/entities/user.entity';
import { Product } from './modules/products/entities/product.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Company } from './modules/companies/entities/company.entity'; 
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // 👇 AGREGAR ESTO
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true para 465, false para otros puertos
        auth: {
          user: 'sistemaerpchile@gmail.com', // ⚠️ PON TU CORREO REAL AQUÍ
          pass: 'jmcw ofwt orgu ekjm', // ⚠️ PON LA CONTRASEÑA DE APLICACIÓN DE 16 LETRAS
        },
      },
      defaults: {
        from: '"Soporte ERP" <no-reply@erp.com>',
      },
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User, Product, Order, OrderItem, Expense, Category, Company
      ], 
      autoLoadEntities: true,
      synchronize: true,
      // dropSchema: true,
      ssl: true,
      extra: {
        ssl: { rejectUnauthorized: false },
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
    CategoriesModule,
    
    // 👇 2. AGREGARLO AL ARRAY DE IMPORTS
    CompaniesModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}