import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Like } from 'typeorm';
import { CreditNoteOrm } from '../entities/credit-note.entity';
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

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(CreditNoteOrm);
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
        return {
            items: entities.map(CreditNoteMapper.toDomain),
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
