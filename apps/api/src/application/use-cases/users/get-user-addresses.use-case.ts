import { Inject, Injectable } from '@nestjs/common';
import { Address } from '../../../domain/entities/address.entity';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';

@Injectable()
export class GetUserAddressesUseCase {
    constructor(
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
    ) { }

    async execute(userId: string): Promise<Address[]> {
        return this.addressRepository.findAllByUserId(userId);
    }
}
