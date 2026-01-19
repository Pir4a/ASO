import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User as TypeOrmUser } from '../entities/user.entity';
import { User as DomainUser } from '../../../../domain/entities/user.entity';
import { UserRepository } from '../../../../domain/repositories/user.repository.interface';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PostgresUserRepository implements UserRepository {
    private readonly repository: Repository<TypeOrmUser>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(TypeOrmUser);
    }

    async findAll(): Promise<DomainUser[]> {
        const entities = await this.repository.find();
        return entities.map(UserMapper.toDomain);
    }

    async findByEmail(email: string): Promise<DomainUser | null> {
        const entity = await this.repository.findOne({ where: { email } });
        if (!entity) return null;
        return UserMapper.toDomain(entity);
    }

    async findByVerificationToken(token: string): Promise<DomainUser | null> {
        const entity = await this.repository.findOne({ where: { verificationToken: token } });
        if (!entity) return null;
        return UserMapper.toDomain(entity);
    }

    async create(user: DomainUser): Promise<DomainUser> {
        const persistenceEntity = UserMapper.toPersistence(user);
        const newEntity = await this.repository.save(persistenceEntity);
        return UserMapper.toDomain(newEntity);
    }

    async findById(id: string): Promise<DomainUser | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return UserMapper.toDomain(entity);
    }

    async update(user: DomainUser): Promise<DomainUser> {
        const persistenceEntity = UserMapper.toPersistence(user);
        const savedEntity = await this.repository.save(persistenceEntity);
        return UserMapper.toDomain(savedEntity);
    }
}
