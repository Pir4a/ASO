import { User as DomainUser } from '../../../../domain/entities/user.entity';
import { User as TypeOrmUser } from '../entities/user.entity';

export class UserMapper {
    static toDomain(entity: TypeOrmUser): DomainUser {
        const user = new DomainUser({
            id: entity.id,
            email: entity.email,
            passwordHash: entity.passwordHash,
            role: entity.role,
        });
        return user;
    }

    static toPersistence(domain: DomainUser): TypeOrmUser {
        const entity = new TypeOrmUser();
        entity.id = domain.id;
        entity.email = domain.email;
        entity.passwordHash = domain.passwordHash;
        entity.role = domain.role;
        return entity;
    }
}
