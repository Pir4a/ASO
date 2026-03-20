import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User as UserEntity } from '../persistence/typeorm/entities/user.entity';
import { PostgresUserRepository } from '../persistence/typeorm/repositories/postgres-user.repository';
import { UsersController } from '../controllers/users/users.controller';
import { AdminUsersController } from '../controllers/admin/users.controller';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { GetUsersUseCase } from '../../application/use-cases/users/get-users.use-case';
import { FindUserByEmailUseCase } from '../../application/use-cases/users/find-user-by-email.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case';
import { GetAdminUsersUseCase } from '../../application/use-cases/users/get-admin-users.use-case';
import { UpdateUserStatusUseCase } from '../../application/use-cases/users/update-user-status.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/users/update-user-role.use-case';
import { ResetUserPasswordUseCase } from '../../application/use-cases/users/reset-user-password.use-case';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.interface';
import { RolesGuard } from '../guards/roles.guard';
import { OrdersModule } from './orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), forwardRef(() => OrdersModule)],
  controllers: [UsersController, AdminUsersController],
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PostgresUserRepository,
    },
    CreateUserUseCase,
    GetUsersUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    VerifyEmailUseCase,
    GetAdminUsersUseCase,
    UpdateUserStatusUseCase,
    UpdateUserRoleUseCase,
    ResetUserPasswordUseCase,
    RolesGuard,
  ],
  exports: [
    CreateUserUseCase,
    GetUsersUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    VerifyEmailUseCase,
    USER_REPOSITORY_TOKEN,
  ],
})
export class UsersModule { }
