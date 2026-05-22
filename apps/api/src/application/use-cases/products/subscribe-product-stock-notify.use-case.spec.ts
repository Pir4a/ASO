import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SubscribeProductStockNotifyUseCase } from './subscribe-product-stock-notify.use-case';
import { Product } from '../../../domain/entities/product.entity';
import { ProductStockNotification } from '../../../infrastructure/persistence/typeorm/entities/product-stock-notification.entity';
import type { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { EmailGateway } from '../../../domain/gateways/email.gateway';

function buildProductRepo(): jest.Mocked<ProductRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findOneBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFeatured: jest.fn(),
    browse: jest.fn(),
    findRelatedBySlug: jest.fn(),
    search: jest.fn(),
  };
}

function buildEmailGateway(): jest.Mocked<EmailGateway> {
  return {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendInvoiceEmail: jest.fn(),
    sendEmailChangeConfirmation: jest.fn(),
    sendOrderConfirmation: jest.fn(),
    sendCreditNoteEmail: jest.fn(),
    sendGuestSignupEmail: jest.fn(),
    sendChatReply: jest.fn(),
    sendStockNotifyConfirmationEmail: jest.fn(),
    sendProductBackInStockEmail: jest.fn(),
  };
}

function buildNotifsRepo(): jest.Mocked<
  Pick<Repository<ProductStockNotification>, 'findOne' | 'save' | 'create'>
> {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  } as never;
}

const inStockProduct = () =>
  new Product({
    id: 'prod-1',
    slug: 'scanner-1',
    name: 'Scanner 1',
    stock: 10,
    status: 'in_stock',
    price: 100,
    currency: 'EUR',
    categoryId: 'cat',
    published: true,
  } as Partial<Product>);

const oosProduct = () =>
  new Product({
    id: 'prod-1',
    slug: 'scanner-1',
    name: 'Scanner 1',
    stock: 0,
    status: 'out_of_stock',
    price: 100,
    currency: 'EUR',
    categoryId: 'cat',
    published: true,
  } as Partial<Product>);

describe('SubscribeProductStockNotifyUseCase', () => {
  let productRepository: jest.Mocked<ProductRepository>;
  let emailGateway: jest.Mocked<EmailGateway>;
  let notifsRepo: ReturnType<typeof buildNotifsRepo>;
  let useCase: SubscribeProductStockNotifyUseCase;

  beforeEach(() => {
    productRepository = buildProductRepo();
    emailGateway = buildEmailGateway();
    notifsRepo = buildNotifsRepo();
    useCase = new SubscribeProductStockNotifyUseCase(
      notifsRepo as unknown as Repository<ProductStockNotification>,
      productRepository,
      emailGateway,
    );
  });

  it('throws NotFoundException when the product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ productId: 'nope', emailFromBody: 'a@b.c' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects with PRODUCT_IN_STOCK when the product is still available', async () => {
    productRepository.findById.mockResolvedValue(inStockProduct());
    await expect(
      useCase.execute({ productId: 'prod-1', emailFromBody: 'a@b.c' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects with EMAIL_REQUIRED when no email is provided', async () => {
    productRepository.findById.mockResolvedValue(oosProduct());
    await expect(useCase.execute({ productId: 'prod-1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns duplicate: true when the (productId, email) row already exists', async () => {
    productRepository.findById.mockResolvedValue(oosProduct());
    notifsRepo.findOne.mockResolvedValue({
      id: 'n1',
      productId: 'prod-1',
      email: 'a@b.c',
      userId: null,
    } as ProductStockNotification);

    const result = await useCase.execute({
      productId: 'prod-1',
      emailFromBody: 'A@B.C',
    });
    expect(result).toEqual({ ok: true, duplicate: true });
    expect(notifsRepo.save).not.toHaveBeenCalled();
    expect(emailGateway.sendStockNotifyConfirmationEmail).not.toHaveBeenCalled();
  });

  it('persists a fresh subscription + sends the confirmation email', async () => {
    productRepository.findById.mockResolvedValue(oosProduct());
    notifsRepo.findOne.mockResolvedValue(null);
    notifsRepo.create.mockImplementation((data) => data as ProductStockNotification);
    notifsRepo.save.mockImplementation((e) => Promise.resolve(e as ProductStockNotification));

    const result = await useCase.execute({
      productId: 'prod-1',
      emailFromBody: 'A@B.C',
      user: { sub: 'user-1', email: 'priority@me.com' },
    });

    expect(result).toEqual({ ok: true, duplicate: false });
    // Authenticated user's email beats the body email per resolveStockNotifyEmail.
    expect(notifsRepo.create).toHaveBeenCalledWith({
      productId: 'prod-1',
      email: 'priority@me.com',
      userId: 'user-1',
    });
    expect(emailGateway.sendStockNotifyConfirmationEmail).toHaveBeenCalledWith(
      'priority@me.com',
      'Scanner 1',
      'scanner-1',
    );
  });

  it('still returns ok when the confirmation email fails (best-effort)', async () => {
    productRepository.findById.mockResolvedValue(oosProduct());
    notifsRepo.findOne.mockResolvedValue(null);
    notifsRepo.create.mockImplementation((data) => data as ProductStockNotification);
    notifsRepo.save.mockImplementation((e) => Promise.resolve(e as ProductStockNotification));
    emailGateway.sendStockNotifyConfirmationEmail.mockRejectedValue(new Error('SMTP down'));

    const result = await useCase.execute({
      productId: 'prod-1',
      emailFromBody: 'a@b.c',
    });
    expect(result).toEqual({ ok: true, duplicate: false });
  });
});
