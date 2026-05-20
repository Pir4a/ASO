import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Like } from 'typeorm';
import { CreditNoteOrm } from '../entities/credit-note.entity';
import { InvoiceOrm } from '../entities/invoice.entity';
import { User } from '../entities/user.entity';
import { CreditNote as DomainCreditNote } from '../../../../domain/entities/credit-note.entity';
import {
    CreditNoteRepository,
    CreditNoteFilters,
    PaginatedCreditNotes,
} from '../../../../domain/repositories/credit-note.repository.interface';
import { CreditNoteMapper } from '../mappers/credit-note.mapper';

@Injectable()
export class CreditNoteOrmRepository implements CreditNoteRepository {
    private readonly repository: Repository<CreditNoteOrm>;
    private readonly invoiceRepository: Repository<InvoiceOrm>;
    private readonly userRepository: Repository<User>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(CreditNoteOrm);
        this.invoiceRepository = dataSource.getRepository(InvoiceOrm);
        this.userRepository = dataSource.getRepository(User);
    }

    async create(creditNote: DomainCreditNote): Promise<DomainCreditNote> {
        const entity = CreditNoteMapper.toPersistence(creditNote);
        const saved = await this.repository.save(entity);
        return CreditNoteMapper.toDomain(saved);
    }

    async findById(id: string): Promise<DomainCreditNote | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? CreditNoteMapper.toDomain(entity) : null;
    }

    async findByInvoiceId(invoiceId: string): Promise<DomainCreditNote | null> {
        const entity = await this.repository.findOne({ where: { invoiceId } });
        return entity ? CreditNoteMapper.toDomain(entity) : null;
    }

    async findAll(filters: CreditNoteFilters): Promise<PaginatedCreditNotes> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25;

        const qb = this.repository.createQueryBuilder('cn').orderBy('cn.issuedAt', 'DESC');

        if (filters.invoiceId) {
            qb.andWhere('cn.invoiceId = :invoiceId', { invoiceId: filters.invoiceId });
        }
        if (filters.reason) {
            qb.andWhere('cn.reason = :reason', { reason: filters.reason });
        }
        if (filters.search) {
            qb.andWhere('cn.number ILIKE :search', { search: `%${filters.search}%` });
        }

        qb.skip((page - 1) * pageSize).take(pageSize);
        const [entities, total] = await qb.getManyAndCount();

        // Batch-resolve linked invoice numbers and customer emails so the BO
        // can render the "facture liée" + "client" columns without N+1 calls.
        const invoiceIds = Array.from(new Set(entities.map((e) => e.invoiceId)));
        const userIds = Array.from(
            new Set(entities.map((e) => e.userId).filter((u): u is string => !!u)),
        );
        const [invoices, users] = await Promise.all([
            invoiceIds.length
                ? this.invoiceRepository.find({
                      where: invoiceIds.map((id) => ({ id })),
                      select: ['id', 'number'],
                  })
                : Promise.resolve([] as InvoiceOrm[]),
            userIds.length
                ? this.userRepository.find({
                      where: userIds.map((id) => ({ id })),
                      select: ['id', 'email'],
                  })
                : Promise.resolve([] as User[]),
        ]);
        const invoiceNumberById = new Map(invoices.map((inv) => [inv.id, inv.number]));
        const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

        return {
            items: entities.map((entity) => ({
                creditNote: CreditNoteMapper.toDomain(entity),
                invoiceNumber: invoiceNumberById.get(entity.invoiceId) ?? null,
                customerEmail: entity.userId ? emailByUserId.get(entity.userId) ?? null : null,
            })),
            total,
            page,
            pageSize,
        };
    }

    async nextSequenceForDay(prefix: string): Promise<number> {
        // prefix is e.g. "AVO-20260425-"
        const rows = await this.repository.find({
            where: { number: Like(`${prefix}%`) },
            select: ['number'],
        });
        let max = 0;
        for (const row of rows) {
            const tail = row.number.slice(prefix.length);
            const n = Number.parseInt(tail, 10);
            if (Number.isFinite(n) && n > max) max = n;
        }
        return max + 1;
    }
}
