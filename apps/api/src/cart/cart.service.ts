import { Injectable } from '@nestjs/common';

@Injectable()
export class CartService {
  getCart() {
    const items = [
      {
        productId: 'prod-1',
        name: 'Scanner CT 500',
        quantity: 1,
        priceCents: 12500000,
        currency: 'EUR',
      },
    ];
    const subtotal = items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );
    const vat = Math.round(subtotal * 0.2);
    const total = subtotal + vat;
    return { items, subtotal, vat, total, currency: 'EUR' };
  }
}
