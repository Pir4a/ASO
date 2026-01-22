import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './infrastructure/ioc/users.module';
import { AuthModule } from './infrastructure/ioc/auth.module';
import { ProductsModule } from './infrastructure/ioc/products.module';
import { CategoriesModule } from './infrastructure/ioc/categories.module';
import { CartModule } from './infrastructure/ioc/cart.module';
import { OrdersModule } from './infrastructure/ioc/orders.module';
import { AddressModule } from './infrastructure/ioc/address.module';
import { ContentModule } from './infrastructure/ioc/content.module';
import { PaymentModule } from './infrastructure/ioc/payment.module';
import { ContactModule } from './infrastructure/ioc/contact.module';
import { AppDataSource } from './db/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    AddressModule,
    ContentModule,
    PaymentModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
