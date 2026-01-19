import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Address } from '../../../domain/entities/address.entity';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';

@Injectable()
export class UpdateUserAddressUseCase {
    constructor(
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
    ) { }

    async execute(userId: string, addressId: string, updates: Partial<Address>): Promise<Address> {
        const address = await this.addressRepository.findById(addressId);

        if (!address) {
            throw new NotFoundException('Adresse introuvable.');
        }

        if (address.userId !== userId) {
            throw new ForbiddenException('Vous n\'avez pas accès à cette adresse.');
        }

        Object.assign(address, updates);
        return this.addressRepository.update(address);
    }
}
