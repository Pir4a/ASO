import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Address as TypeOrmAddress } from '../entities/address.entity';
import { Address as DomainAddress } from '../../../../domain/entities/address.entity';
import { AddressRepository } from '../../../../domain/repositories/address.repository.interface';
import { AddressMapper } from '../mappers/address.mapper';

@Injectable()
export class TypeOrmAddressRepository implements AddressRepository {
    private readonly repository: Repository<TypeOrmAddress>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(TypeOrmAddress);
    }

    async findAllByUserId(userId: string): Promise<DomainAddress[]> {
        const entities = await this.repository.find({ where: { userId } });
        return entities.map(AddressMapper.toDomain);
    }

    async findById(id: string): Promise<DomainAddress | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return AddressMapper.toDomain(entity);
    }

    async create(address: DomainAddress): Promise<DomainAddress> {
        const persistenceEntity = AddressMapper.toPersistence(address);
        const newEntity = await this.repository.save(persistenceEntity);
        return AddressMapper.toDomain(newEntity);
    }

    async update(address: DomainAddress): Promise<DomainAddress> {
        const persistenceEntity = AddressMapper.toPersistence(address);
        const savedEntity = await this.repository.save(persistenceEntity);
        return AddressMapper.toDomain(savedEntity);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
