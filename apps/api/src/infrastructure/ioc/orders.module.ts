import { Module } from '@nestjs/common';
import { OrdersController } from '../controllers/orders/orders.controller';
import { GetOrdersUseCase } from '../../application/use-cases/orders/get-orders.use-case';

@Module({
    controllers: [OrdersController],
    providers: [GetOrdersUseCase],
})
export class OrdersModule { }
