import { Injectable } from '@nestjs/common';

@Injectable()
export class GetOrdersUseCase {
    execute() {
        // Mock logic from original OrdersService
        return [
            {
                id: 'CMD-2025-001',
                totalCents: 1520000,
                currency: 'EUR',
                status: 'processing',
                createdAt: new Date().toISOString(),
            },
        ];
    }
}
