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

    async execute(userId: string, data: { street: string; city: string; postalCode: string; country: string; phone?: string }): Promise<Address> {
        const address = new Address({
            id: uuidv4(),
            userId,
            street: data.street,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone
        });
        return this.addressRepository.create(address);
    }
}
