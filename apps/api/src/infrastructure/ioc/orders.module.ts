import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../persistence/typeorm/entities/order.entity';
import { OrderItem } from '../persistence/typeorm/entities/order-item.entity';
import { TypeOrmOrderRepository } from '../persistence/typeorm/repositories/order.repository';
import { ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository.interface';
import { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case';
import { CartModule } from './cart.module';
import { CheckoutController } from '../controllers/checkout.controller';
import { AddressModule } from './address.module';
import { UsersModule } from './users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem]),
        CartModule,
        UsersModule,
        AddressModule,
    ],
    controllers: [CheckoutController],
    providers: [
        {
            provide: ORDER_REPOSITORY_TOKEN,
            useClass: TypeOrmOrderRepository,
        },
        CreateOrderUseCase,
    ],
    exports: [ORDER_REPOSITORY_TOKEN],
})
export class OrdersModule { }
