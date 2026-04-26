import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Invoice } from '../../../../domain/entities/invoice.entity';
import {
    InvoiceListFilters,
    InvoiceListResult,
    InvoiceRepository,
} from '../../../../domain/repositories/invoice.repository.interface';
import { InvoiceOrm } from '../entities/invoice.entity';
import { User } from '../entities/user.entity';
import { invoiceToDomain, invoiceToPersistence } from '../mappers/invoice.mapper';

@Injectable()
export class TypeOrmInvoiceRepository implements InvoiceRepository {
    constructor(
        @InjectRepository(InvoiceOrm)
        private readonly repo: Repository<InvoiceOrm>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async create(invoice: Invoice): Promise<Invoice> {
        const orm = this.repo.create(invoiceToPersistence(invoice));
        const saved = await this.repo.save(orm);
        return invoiceToDomain(saved);
    }

    async update(invoice: Invoice): Promise<Invoice> {
        await this.repo.save(invoiceToPersistence(invoice));
        const reloaded = await this.repo.findOneByOrFail({ id: invoice.id });
        return invoiceToDomain(reloaded);
    }

    async findById(id: string): Promise<Invoice | null> {
        const orm = await this.repo.findOneBy({ id });
        return orm ? invoiceToDomain(orm) : null;
    }

    async findByOrderId(orderId: string): Promise<Invoice | null> {
        const orm = await this.repo.findOneBy({ orderId });
        return orm ? invoiceToDomain(orm) : null;
    }

    async findByNumber(number: string): Promise<Invoice | null> {
        const orm = await this.repo.findOneBy({ number });
        return orm ? invoiceToDomain(orm) : null;
    }

    async countByDate(date: Date): Promise<number> {
        const start = new Date(date);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);
        return this.repo.count({ where: { issuedAt: Between(start, end) } });
    }

    async list(params: {
        skip: number;
        take: number;
        filters: InvoiceListFilters;
    }): Promise<InvoiceListResult> {
        const where: Record<string, unknown> = {};
        if (params.filters.status) where.status = params.filters.status;
        if (params.filters.userId) where.userId = params.filters.userId;
        if (params.filters.orderId) where.orderId = params.filters.orderId;
        if (params.filters.fromDate && params.filters.toDate) {
            where.issuedAt = Between(params.filters.fromDate, params.filters.toDate);
        } else if (params.filters.fromDate) {
            where.issuedAt = MoreThanOrEqual(params.filters.fromDate);
        } else if (params.filters.toDate) {
            where.issuedAt = LessThanOrEqual(params.filters.toDate);
        }

        const [orms, total] = await this.repo.findAndCount({
            where,
            order: { issuedAt: 'DESC' },
            skip: params.skip,
            take: params.take,
        });

        const userIds = Array.from(
            new Set(orms.map((o) => o.userId).filter((u): u is string => u !== null)),
        );
        const users = userIds.length
            ? await this.userRepo.findBy(userIds.map((id) => ({ id })))
            : [];
        const emailById = new Map(users.map((u) => [u.id, u.email]));

        return {
            rows: orms.map((o) => ({
                invoice: invoiceToDomain(o),
                customerEmail: o.userId ? emailById.get(o.userId) ?? null : null,
            })),
            total,
        };
    }
}
