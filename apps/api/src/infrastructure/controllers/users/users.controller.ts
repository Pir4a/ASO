import { Controller, Get, Inject } from '@nestjs/common';
import { GetUsersUseCase } from '../../../application/use-cases/users/get-users.use-case';

@Controller('users')
export class UsersController {
    constructor(
        private readonly getUsersUseCase: GetUsersUseCase,
    ) { }

    @Get()
    async findAll() {
        return this.getUsersUseCase.execute();
    }
}
