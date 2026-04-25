import { Inject, Injectable } from '@nestjs/common';
import { Address } from '../../../domain/entities/address.entity';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateUserAddressUseCase {
    constructor(
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
    ) { }

    async execute(
        userId: string,
        data: {
            firstName?: string;
            lastName?: string;
            street: string;
            address2?: string;
            city: string;
            region?: string;
            postalCode: string;
            country: string;
            phone?: string;
        },
    ): Promise<Address> {
        const address = new Address({
            id: uuidv4(),
            userId,
            firstName: data.firstName,
            lastName: data.lastName,
            street: data.street,
            address2: data.address2,
            city: data.city,
            region: data.region,
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone,
        });
        return this.addressRepository.create(address);
    }
}
