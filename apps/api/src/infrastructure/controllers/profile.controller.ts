import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GetUserAddressesUseCase } from '../../application/use-cases/users/get-user-addresses.use-case';
// import { JwtAuthGuard } from '../guards/jwt-auth.guard'; 

import { CreateUserAddressUseCase } from '../../application/use-cases/users/create-user-address.use-case';

@Controller('profile')
export class ProfileController {
    constructor(
        private readonly getUserAddressesUseCase: GetUserAddressesUseCase,
        private readonly createUserAddressUseCase: CreateUserAddressUseCase,
    ) { }

    // @UseGuards(JwtAuthGuard)
    @Get('addresses')
    async getAddresses(@Request() req: any) {
        const userId = req.user?.id || 'guest-user-id'; // Replace with real auth
        // Note: guests don't really have saved addresses usually, but logical placeholder
        return this.getUserAddressesUseCase.execute(userId);
    }

    @Post('addresses')
    async createAddress(@Request() req: any, @Body() body: { street: string; city: string; postalCode: string; country: string; phone?: string }) {
        const userId = req.user?.id || 'guest-user-id';
        return this.createUserAddressUseCase.execute(userId, body);
    }
}
