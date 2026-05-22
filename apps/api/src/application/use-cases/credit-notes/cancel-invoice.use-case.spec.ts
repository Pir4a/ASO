import { NotFoundException } from '@nestjs/common';
import {
  CancelInvoiceUseCase,
  formatCreditNoteNumber,
  creditNotePrefix,
} from './cancel-invoice.use-case';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { CreditNote } from '../../../domain/entities/credit-note.entity';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { CreditNoteRepository } from '../../../domain/repositories/credit-note.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';

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

function buildCreditNoteRepo(): jest.Mocked<CreditNoteRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByInvoiceId: jest.fn(),
    findAll: jest.fn(),
    nextSequenceForDay: jest.fn(),
  };
}

function buildOrderRepo(): jest.Mocked<OrderRepository> {
  return {
    findAllByUserId: jest.fn(),
    findByUserIdWithFilters: jest.fn(),
    findOneByIdAndUserId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    findAllForAdmin: jest.fn(),
    getAdminDashboard: jest.fn(),
    getCustomerStats: jest.fn(),
    getSalesByCategory: jest.fn(),
    getAvgCartByCategory: jest.fn(),
  };
}

const invoice = (overrides: Partial<Invoice> = {}): Invoice =>
  new Invoice({
    id: 'inv-1',
    number: 'INV-20260522-0001',
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

describe('CancelInvoiceUseCase', () => {
  let invoices: jest.Mocked<InvoiceRepository>;
  let creditNotes: jest.Mocked<CreditNoteRepository>;
  let orders: jest.Mocked<OrderRepository>;
  let useCase: CancelInvoiceUseCase;

  beforeEach(() => {
    invoices = buildInvoiceRepo();
    creditNotes = buildCreditNoteRepo();
    orders = buildOrderRepo();
    useCase = new CancelInvoiceUseCase(creditNotes, invoices, orders);
  });

  it('throws NotFoundException when invoice does not exist', async () => {
    invoices.findById.mockResolvedValue(null);
    await expect(useCase.execute({ invoiceId: 'missing' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('is idempotent: returns existing credit note without re-cancelling', async () => {
    const inv = invoice();
    invoices.findById.mockResolvedValue(inv);
    const existing = new CreditNote({
      id: 'cn-1',
      number: 'AVO-20260522-0001',
      invoiceId: inv.id,
      userId: inv.userId,
      amountTtcCents: -12000,
      currency: 'EUR',
      reason: 'cancellation',
      issuedAt: new Date(),
      pdfUrl: null,
    });
    creditNotes.findByInvoiceId.mockResolvedValue(existing);

    const result = await useCase.execute({ invoiceId: inv.id });

    expect(result).toBe(existing);
    expect(invoices.update).not.toHaveBeenCalled();
    expect(creditNotes.create).not.toHaveBeenCalled();
  });

  it('flips invoice to cancelled, cancels the order, and creates a mirror AVO with negative amount (CDC §X.6)', async () => {
    const inv = invoice({ status: 'paid', totalTtcCents: 9999 });
    invoices.findById.mockResolvedValue(inv);
    creditNotes.findByInvoiceId.mockResolvedValue(null);
    invoices.update.mockImplementation((i) => Promise.resolve(i));
    orders.findById.mockResolvedValue({ id: 'order-1', status: 'processing' } as never);
    orders.updateStatus.mockResolvedValue({} as never);
    creditNotes.nextSequenceForDay.mockResolvedValue(7);
    creditNotes.create.mockImplementation((cn) => Promise.resolve(cn));

    const result = await useCase.execute({ invoiceId: inv.id, reason: 'refund' });

    expect(inv.status).toBe('cancelled');
    expect(invoices.update).toHaveBeenCalledWith(inv);
    expect(orders.updateStatus).toHaveBeenCalledWith('order-1', 'cancelled');
    expect(creditNotes.create).toHaveBeenCalledTimes(1);
    expect(result.amountTtcCents).toBe(-9999);
    expect(result.reason).toBe('refund');
    expect(result.number).toMatch(/^AVO-\d{8}-0007$/);
  });

  it('defaults reason to "cancellation" when none is supplied', async () => {
    const inv = invoice();
    invoices.findById.mockResolvedValue(inv);
    creditNotes.findByInvoiceId.mockResolvedValue(null);
    invoices.update.mockImplementation((i) => Promise.resolve(i));
    orders.findById.mockResolvedValue(null);
    creditNotes.nextSequenceForDay.mockResolvedValue(1);
    creditNotes.create.mockImplementation((cn) => Promise.resolve(cn));

    const result = await useCase.execute({ invoiceId: inv.id });
    expect(result.reason).toBe('cancellation');
  });

  it('does not throw when underlying order cancellation fails (best-effort)', async () => {
    const inv = invoice();
    invoices.findById.mockResolvedValue(inv);
    creditNotes.findByInvoiceId.mockResolvedValue(null);
    invoices.update.mockImplementation((i) => Promise.resolve(i));
    orders.findById.mockRejectedValue(new Error('db down'));
    creditNotes.nextSequenceForDay.mockResolvedValue(1);
    creditNotes.create.mockImplementation((cn) => Promise.resolve(cn));

    await expect(useCase.execute({ invoiceId: inv.id })).resolves.toBeDefined();
    expect(creditNotes.create).toHaveBeenCalledTimes(1);
  });
});

describe('formatCreditNoteNumber', () => {
  it('produces AVO-YYYYMMDD-XXXX with zero-padded sequence', () => {
    const d = new Date(Date.UTC(2026, 4, 22, 12)); // 2026-05-22
    expect(formatCreditNoteNumber(3, d)).toBe('AVO-20260522-0003');
    expect(formatCreditNoteNumber(1234, d)).toBe('AVO-20260522-1234');
  });
});

describe('creditNotePrefix', () => {
  it('builds the per-day sequence prefix used by nextSequenceForDay', () => {
    expect(creditNotePrefix(new Date(Date.UTC(2026, 0, 5, 12)))).toBe(
      'AVO-20260105-',
    );
  });
});
