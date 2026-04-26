import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order as TypeOrmOrder } from '../../../infrastructure/persistence/typeorm/entities/order.entity';

const PREFIX = 'ALT';

function pad(n: number, len: number): string {
    return n.toString().padStart(len, '0');
}

export function formatOrderNumberDate(date: Date): string {
    const yyyy = date.getUTCFullYear().toString();
    const mm = pad(date.getUTCMonth() + 1, 2);
    const dd = pad(date.getUTCDate(), 2);
    return `${yyyy}${mm}${dd}`;
}

export function buildOrderNumber(date: Date, sequence: number): string {
    return `${PREFIX}-${formatOrderNumberDate(date)}-${pad(sequence, 4)}`;
}

/**
 * Generates a sequential customer-facing order number ALT-YYYYMMDD-XXXX,
 * where XXXX is the daily sequence (1-based) padded to 4 digits.
 */
@Injectable()
export class OrderNumberService {
    constructor(private readonly dataSource: DataSource) { }

    async generate(now: Date = new Date()): Promise<string> {
        const datePart = formatOrderNumberDate(now);
        const prefix = `${PREFIX}-${datePart}-`;

        const repository = this.dataSource.getRepository(TypeOrmOrder);
        const count = await repository
            .createQueryBuilder('o')
            .where('o."orderNumber" LIKE :prefix', { prefix: `${prefix}%` })
            .getCount();

        return buildOrderNumber(now, count + 1);
    }
}
