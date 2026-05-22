import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MarkContactMessageReadUseCase } from './mark-contact-message-read.use-case';
import { ContactMessage } from '../../../infrastructure/persistence/typeorm/entities/contact-message.entity';

function buildRepo(): jest.Mocked<Pick<Repository<ContactMessage>, 'findOne' | 'save'>> {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
  } as never;
}

const message = (overrides: Partial<ContactMessage> = {}): ContactMessage =>
  ({
    id: 'm1',
    subject: 's',
    email: 'a@b.c',
    message: 'hello',
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  }) as ContactMessage;

describe('MarkContactMessageReadUseCase', () => {
  it('throws NotFoundException when no row matches the id', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(null);
    const useCase = new MarkContactMessageReadUseCase(repo as unknown as Repository<ContactMessage>);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('flips isRead from false to true and persists (CDC §XVI.1 — clears the badge)', async () => {
    const repo = buildRepo();
    const row = message({ isRead: false });
    repo.findOne.mockResolvedValue(row);
    repo.save.mockImplementation((m) => Promise.resolve(m as ContactMessage));
    const useCase = new MarkContactMessageReadUseCase(repo as unknown as Repository<ContactMessage>);

    const result = await useCase.execute('m1');
    expect(result.isRead).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(row);
  });

  it('does not re-save an already-read message (idempotent)', async () => {
    const repo = buildRepo();
    repo.findOne.mockResolvedValue(message({ isRead: true }));
    const useCase = new MarkContactMessageReadUseCase(repo as unknown as Repository<ContactMessage>);

    const result = await useCase.execute('m1');
    expect(result.isRead).toBe(true);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
