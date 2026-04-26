import { User as DomainUser } from '../../../../domain/entities/user.entity';
import { User as TypeOrmUser } from '../entities/user.entity';

export class UserMapper {
    static toDomain(entity: TypeOrmUser): DomainUser {
        const user = new DomainUser({
            id: entity.id,
            email: entity.email,
            passwordHash: entity.passwordHash,
            role: entity.role,
            firstName: entity.firstName,
            lastName: entity.lastName,
            isVerified: entity.isVerified,
            isActive: entity.isActive,
            verificationToken: entity.verificationToken,
            verificationTokenExpires: entity.verificationTokenExpires,
            passwordResetToken: entity.passwordResetToken ?? null,
            passwordResetTokenExpires: entity.passwordResetTokenExpires ?? null,
            stripeCustomerId: entity.stripeCustomerId,
            lastLoginAt: entity.lastLoginAt,
        });
        return user;
    }

    static toPersistence(domain: DomainUser): TypeOrmUser {
        const entity = new TypeOrmUser();
        entity.id = domain.id;
        entity.email = domain.email;
        entity.passwordHash = domain.passwordHash;
        entity.role = domain.role;
        entity.firstName = domain.firstName;
        entity.lastName = domain.lastName;
        entity.isVerified = domain.isVerified;
        entity.isActive = domain.isActive;
        entity.verificationToken = domain.verificationToken;
        entity.verificationTokenExpires = domain.verificationTokenExpires;
        entity.passwordResetToken = domain.passwordResetToken ?? null;
        entity.passwordResetTokenExpires = domain.passwordResetTokenExpires ?? null;
        entity.stripeCustomerId = domain.stripeCustomerId;
        entity.lastLoginAt = domain.lastLoginAt;
        return entity;
    }
}
