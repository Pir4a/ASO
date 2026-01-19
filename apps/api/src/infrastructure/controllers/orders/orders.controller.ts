import { Controller, Get } from '@nestjs/common';
import { GetOrdersUseCase } from '../../../application/use-cases/orders/get-orders.use-case';

@Controller('orders')
export class OrdersController {
    constructor(private readonly getOrdersUseCase: GetOrdersUseCase) { }

    @Get()
    list() {
        return this.getOrdersUseCase.execute();
    }
}
