import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';

@Injectable()
export class DeleteUserAddressUseCase {
    constructor(
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
    ) { }

    async execute(userId: string, addressId: string): Promise<void> {
        const address = await this.addressRepository.findById(addressId);

        if (!address) {
            throw new NotFoundException('Adresse introuvable.');
        }

        if (address.userId !== userId) {
            throw new ForbiddenException('Vous n\'avez pas accès à cette adresse.');
        }

        await this.addressRepository.delete(addressId);
    }
}
