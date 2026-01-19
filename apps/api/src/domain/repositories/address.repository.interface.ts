import { Address } from '../entities/address.entity';

export interface AddressRepository {
    findAllByUserId(userId: string): Promise<Address[]>;
    findById(id: string): Promise<Address | null>;
    create(address: Address): Promise<Address>;
    update(address: Address): Promise<Address>;
    delete(id: string): Promise<void>;
}

export const ADDRESS_REPOSITORY_TOKEN = 'AddressRepository';
