import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Promotion } from '../../persistence/typeorm/entities/promotion.entity';

interface CreatePromoCodeDto {
    code: string;
    type: 'percentage' | 'fixed' | 'buy_x_get_y';
    value: number;
    minOrderAmount?: number;
    maxUsages?: number;
    maxUsagesPerUser?: number;
    validFrom: string;
    validUntil: string;
    isActive?: boolean;
}

interface UpdatePromoCodeDto extends Partial<CreatePromoCodeDto> { }

interface PromoCodeFilters {
    status?: 'active' | 'expired' | 'all';
    page?: string;
    limit?: string;
}

@Controller('admin/promo-codes')
export class AdminPromoCodesController {
    constructor(private readonly dataSource: DataSource) { }

    @Get()
    async findAll(@Query() query: PromoCodeFilters) {
        const repository = this.dataSource.getRepository(Promotion);
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '20', 10);
        const skip = (page - 1) * limit;

        const qb = repository.createQueryBuilder('promo');

        if (query.status === 'active') {
            qb.where('promo.isActive = :isActive', { isActive: true })
                .andWhere('promo.validUntil > :now', { now: new Date() });
        } else if (query.status === 'expired') {
            qb.where('promo.validUntil <= :now', { now: new Date() });
        }

        qb.orderBy('promo.createdAt', 'DESC');
        qb.skip(skip).take(limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const repository = this.dataSource.getRepository(Promotion);
        const promo = await repository.findOne({ where: { id } });
        if (!promo) {
            throw new Error('Promo code not found');
        }
        return promo;
    }

    @Post()
    async create(@Body() dto: CreatePromoCodeDto) {
        const repository = this.dataSource.getRepository(Promotion);

        const existing = await repository.findOne({ where: { code: dto.code.toUpperCase() } });
        if (existing) {
            throw new Error('Promo code already exists');
        }

        const promo = repository.create({
            code: dto.code.toUpperCase(),
            type: dto.type,
            value: dto.value,
            minOrderAmount: dto.minOrderAmount,
            maxUsages: dto.maxUsages,
            maxUsagesPerUser: dto.maxUsagesPerUser,
            validFrom: new Date(dto.validFrom),
            validUntil: new Date(dto.validUntil),
            isActive: dto.isActive ?? true,
            currentUsages: 0,
        });

        return repository.save(promo);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
        const repository = this.dataSource.getRepository(Promotion);
        const promo = await repository.findOne({ where: { id } });

        if (!promo) {
            throw new Error('Promo code not found');
        }

        // Update fields
        if (dto.code) promo.code = dto.code.toUpperCase();
        if (dto.type) promo.type = dto.type;
        if (dto.value !== undefined) promo.value = dto.value;
        if (dto.minOrderAmount !== undefined) promo.minOrderAmount = dto.minOrderAmount;
        if (dto.maxUsages !== undefined) promo.maxUsages = dto.maxUsages;
        if (dto.maxUsagesPerUser !== undefined) promo.maxUsagesPerUser = dto.maxUsagesPerUser;
        if (dto.validFrom) promo.validFrom = new Date(dto.validFrom);
        if (dto.validUntil) promo.validUntil = new Date(dto.validUntil);
        if (dto.isActive !== undefined) promo.isActive = dto.isActive;

        return repository.save(promo);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        const repository = this.dataSource.getRepository(Promotion);
        const result = await repository.delete({ id });
        if (result.affected === 0) {
            throw new Error('Promo code not found');
        }
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string) {
        const repository = this.dataSource.getRepository(Promotion);
        const promo = await repository.findOne({ where: { id } });

        if (!promo) {
            throw new Error('Promo code not found');
        }

        // Get usage count from PromoCodeUsage table
        const usageRepository = this.dataSource.getRepository('PromoCodeUsage');
        const usageCount = await usageRepository.count({ where: { promotionId: id } });

        return {
            promo,
            totalUsages: promo.currentUsages,
            uniqueUsers: usageCount,
            remainingUsages: promo.maxUsages ? promo.maxUsages - promo.currentUsages : null,
            isExpired: new Date() > promo.validUntil,
        };
    }
}
