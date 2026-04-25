import { Address as DomainAddress } from '../../../../domain/entities/address.entity';
import { Address as TypeOrmAddress } from '../entities/address.entity';

export class AddressMapper {
  static toDomain(entity: TypeOrmAddress): DomainAddress {
    return new DomainAddress({
      id: entity.id,
      userId: entity.userId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      street: entity.street,
      address2: entity.address2,
      city: entity.city,
      region: entity.region,
      postalCode: entity.postalCode,
      country: entity.country,
      phone: entity.phone,
    });
  }

  static toPersistence(domain: DomainAddress): TypeOrmAddress {
    const entity = new TypeOrmAddress();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.street = domain.street;
    entity.address2 = domain.address2;
    entity.city = domain.city;
    entity.region = domain.region;
    entity.postalCode = domain.postalCode;
    entity.country = domain.country;
    entity.phone = domain.phone;
    return entity;
  }
}
