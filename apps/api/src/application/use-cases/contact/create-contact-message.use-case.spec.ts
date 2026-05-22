import { Repository } from 'typeorm';
import { CreateContactMessageUseCase } from './create-contact-message.use-case';
import { ContactMessage } from '../../../infrastructure/persistence/typeorm/entities/contact-message.entity';

function buildRepo(): jest.Mocked<Pick<Repository<ContactMessage>, 'create' | 'save'>> {
  return {
    create: jest.fn(),
    save: jest.fn(),
  } as never;
}

describe('CreateContactMessageUseCase', () => {
  it('trims subject/message and lowercases email before persisting (CDC §XV)', async () => {
    const repo = buildRepo();
    repo.create.mockImplementation((data) => ({ id: 'm1', isRead: false, ...data }) as ContactMessage);
    repo.save.mockImplementation((entity) => Promise.resolve(entity as ContactMessage));

    const useCase = new CreateContactMessageUseCase(repo as unknown as Repository<ContactMessage>);

    const result = await useCase.execute({
      subject: '  Question commande  ',
      email: '  CUSTOMER@Althea.LOCAL  ',
      message: '  Hello, my order #42 is late.  ',
    });

    expect(repo.create).toHaveBeenCalledWith({
      subject: 'Question commande',
      email: 'customer@althea.local',
      message: 'Hello, my order #42 is late.',
    });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.subject).toBe('Question commande');
  });

  it('returns the persisted entity (with the id assigned by the ORM)', async () => {
    const repo = buildRepo();
    repo.create.mockImplementation((data) => ({ id: 'will-be-overwritten', ...data }) as ContactMessage);
    repo.save.mockResolvedValue({
      id: 'm-uuid-42',
      subject: 's',
      email: 'a@b.c',
      message: 'm',
      isRead: false,
      createdAt: new Date(),
    } as ContactMessage);

    const useCase = new CreateContactMessageUseCase(repo as unknown as Repository<ContactMessage>);
    const result = await useCase.execute({ subject: 's', email: 'a@b.c', message: 'm' });

    expect(result.id).toBe('m-uuid-42');
    expect(result.isRead).toBe(false);
  });
});
