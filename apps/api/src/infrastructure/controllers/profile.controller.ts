import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { GetUserAddressesUseCase } from '../../application/use-cases/users/get-user-addresses.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserAddressUseCase } from '../../application/use-cases/users/create-user-address.use-case';
import { UpdateUserAddressUseCase } from '../../application/use-cases/users/update-user-address.use-case';
import { DeleteUserAddressUseCase } from '../../application/use-cases/users/delete-user-address.use-case';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(
        private readonly getUserAddressesUseCase: GetUserAddressesUseCase,
        private readonly createUserAddressUseCase: CreateUserAddressUseCase,
        private readonly updateUserAddressUseCase: UpdateUserAddressUseCase,
        private readonly deleteUserAddressUseCase: DeleteUserAddressUseCase,
    ) { }

    @Get('addresses')
    async getAddresses(@Request() req: any) {
        return this.getUserAddressesUseCase.execute(req.user.sub);
    }

    @Post('addresses')
    async createAddress(@Request() req: any, @Body() body: { street: string; city: string; postalCode: string; country: string; phone?: string }) {
        return this.createUserAddressUseCase.execute(req.user.sub, body);
    }

    @Put('addresses/:id')
    async updateAddress(
        @Request() req: any,
        @Param('id') addressId: string,
        @Body() body: { street?: string; city?: string; postalCode?: string; country?: string; phone?: string }
    ) {
        return this.updateUserAddressUseCase.execute(req.user.sub, addressId, body);
    }

    @Delete('addresses/:id')
    async deleteAddress(@Request() req: any, @Param('id') addressId: string) {
        return this.deleteUserAddressUseCase.execute(req.user.sub, addressId);
    }
}
