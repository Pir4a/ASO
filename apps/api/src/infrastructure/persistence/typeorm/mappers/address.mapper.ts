import { Address as DomainAddress } from '../../../../domain/entities/address.entity';
import { Address as TypeOrmAddress } from '../entities/address.entity';

export class AddressMapper {
    static toDomain(entity: TypeOrmAddress): DomainAddress {
        return new DomainAddress({
            id: entity.id,
            userId: entity.userId,
            street: entity.street,
            city: entity.city,
            postalCode: entity.postalCode,
            country: entity.country,
            phone: entity.phone,
        });
    }

    static toPersistence(domain: DomainAddress): TypeOrmAddress {
        const entity = new TypeOrmAddress();
        entity.id = domain.id;
        entity.userId = domain.userId;
        entity.street = domain.street;
        entity.city = domain.city;
        entity.postalCode = domain.postalCode;
        entity.country = domain.country;
        entity.phone = domain.phone;
        return entity;
    }
}
