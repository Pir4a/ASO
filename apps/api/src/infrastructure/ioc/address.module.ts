import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../persistence/typeorm/entities/address.entity';
import { TypeOrmAddressRepository } from '../persistence/typeorm/repositories/address.repository';
import { ADDRESS_REPOSITORY_TOKEN } from '../../domain/repositories/address.repository.interface';
import { ProfileController } from '../controllers/profile.controller';
import { GetUserAddressesUseCase } from '../../application/use-cases/users/get-user-addresses.use-case';
import { CreateUserAddressUseCase } from '../../application/use-cases/users/create-user-address.use-case';
import { UpdateUserAddressUseCase } from '../../application/use-cases/users/update-user-address.use-case';
import { DeleteUserAddressUseCase } from '../../application/use-cases/users/delete-user-address.use-case';

@Module({
    imports: [
        TypeOrmModule.forFeature([Address]),
    ],
    controllers: [ProfileController],
    providers: [
        {
            provide: ADDRESS_REPOSITORY_TOKEN,
            useClass: TypeOrmAddressRepository,
        },
        GetUserAddressesUseCase,
        CreateUserAddressUseCase,
        UpdateUserAddressUseCase,
        DeleteUserAddressUseCase,
    ],
    exports: [ADDRESS_REPOSITORY_TOKEN],
})
export class AddressModule { }
