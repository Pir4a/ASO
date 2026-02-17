import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../domain/repositories/address.repository.interface';
import type { AddressRepository } from '../../../domain/repositories/address.repository.interface';
import { GetUsersFilterDto } from '../../../infrastructure/controllers/users/dto/get-users-filter.dto';

@Injectable()
export class GetAdminUsersUseCase {
    constructor(
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository,
        @Inject(ADDRESS_REPOSITORY_TOKEN)
        private readonly addressRepository: AddressRepository,
        // Injection dynamique du repository de commandes (supposé existant via OrdersModule)
        @Inject('ORDER_REPOSITORY_TOKEN')
        private readonly orderRepository: any,
    ) { }

    async execute(filters: GetUsersFilterDto) {
        const users = await this.userRepository.findAll();
        
        // 1. Filtrage (En mémoire pour le MVP)
        let filtered = users;

        if (filters.search) {
            const s = filters.search.toLowerCase();
            filtered = filtered.filter(u => 
                u.email.toLowerCase().includes(s) || 
                (u.firstName && u.firstName.toLowerCase().includes(s)) || 
                (u.lastName && u.lastName.toLowerCase().includes(s))
            );
        }

        if (filters.status) {
            if (filters.status === 'active') {
                filtered = filtered.filter(u => u.isVerified);
            } else if (filters.status === 'pending') {
                filtered = filtered.filter(u => !u.isVerified);
            }
            // 'inactive' pourrait être géré via un champ 'isActive' ou 'banned'
        }

        // 2. Tri
        if (filters.sortBy) {
            filtered.sort((a: any, b: any) => {
                const valA = a[filters.sortBy];
                const valB = b[filters.sortBy];
                if (valA < valB) return filters.sortOrder === 'DESC' ? 1 : -1;
                if (valA > valB) return filters.sortOrder === 'DESC' ? -1 : 1;
                return 0;
            });
        }

        // 3. Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const total = filtered.length;
        const paginated = filtered.slice((page - 1) * limit, page * limit);

        // 4. Enrichissement (Adresses, CA, Nb Commandes)
        const data = await Promise.all(paginated.map(async (user) => {
            const addresses = await this.addressRepository.findAllByUserId(user.id);
            let ordersCount = 0;
            let totalRevenue = 0;
            
            try {
                // Tentative de récupération des stats commandes si le repo est disponible
                if (this.orderRepository && this.orderRepository.findAllByUserId) {
                     const orders = await this.orderRepository.findAllByUserId(user.id);
                     ordersCount = orders.length;
                     totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
                }
            } catch (e) {
                // Fallback si le module Orders n'est pas prêt
            }

            return {
                ...user,
                addresses,
                stats: {
                    ordersCount,
                    totalRevenue,
                    lastConnection: null // À implémenter (nécessite un champ lastLogin sur l'entité User)
                }
            };
        }));

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}