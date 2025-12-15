import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  list() {
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
