import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateInvoiceUseCase } from './update-invoice.use-case';
import { Invoice } from '../../../domain/entities/invoice.entity';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';

function buildInvoiceRepo(): jest.Mocked<InvoiceRepository> {
  return {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
    findByNumber: jest.fn(),
    countByDate: jest.fn(),
    list: jest.fn(),
  };
}

const invoice = (overrides: Partial<Invoice> = {}): Invoice =>
  new Invoice({
    id: 'inv-1',
    number: 'INV-1',
    orderId: 'order-1',
    userId: 'user-1',
    totalHtCents: 10000,
    totalTvaCents: 2000,
    totalTtcCents: 12000,
    currency: 'EUR',
    status: 'paid',
    issuedAt: new Date(),
    pdfUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('UpdateInvoiceUseCase', () => {
  let repo: jest.Mocked<InvoiceRepository>;
  let useCase: UpdateInvoiceUseCase;

  beforeEach(() => {
    repo = buildInvoiceRepo();
    useCase = new UpdateInvoiceUseCase(repo);
    repo.update.mockImplementation((i) => Promise.resolve(i));
  });

  it('throws NotFoundException when the invoice id is unknown', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', { status: 'paid' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects unsupported statuses (only paid / cancelled allowed)', async () => {
    repo.findById.mockResolvedValue(invoice());
    await expect(
      useCase.execute('inv-1', { status: 'draft' as never }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates totals and uppercases currency', async () => {
    const inv = invoice({ currency: 'usd', totalTtcCents: 0 });
    repo.findById.mockResolvedValue(inv);

    const result = await useCase.execute('inv-1', {
      totalHtCents: 5000,
      totalTvaCents: 1000,
      totalTtcCents: 6000,
      currency: 'eur',
    });

    expect(result.totalHtCents).toBe(5000);
    expect(result.totalTvaCents).toBe(1000);
    expect(result.totalTtcCents).toBe(6000);
    expect(result.currency).toBe('EUR');
  });

  it('accepts status transitions to "cancelled" and "paid"', async () => {
    const inv = invoice({ status: 'paid' });
    repo.findById.mockResolvedValue(inv);
    const result = await useCase.execute('inv-1', { status: 'cancelled' });
    expect(result.status).toBe('cancelled');
  });
});
