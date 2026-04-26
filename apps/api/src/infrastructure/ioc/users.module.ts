import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User as UserEntity } from '../persistence/typeorm/entities/user.entity';
import { Order as OrderEntity } from '../persistence/typeorm/entities/order.entity';
import { OrderItem as OrderItemEntity } from '../persistence/typeorm/entities/order-item.entity';
import { Address as AddressEntity } from '../persistence/typeorm/entities/address.entity';
import { PostgresUserRepository } from '../persistence/typeorm/repositories/postgres-user.repository';
import { TypeOrmOrderRepository } from '../persistence/typeorm/repositories/order.repository';
import { TypeOrmAddressRepository } from '../persistence/typeorm/repositories/address.repository';
import { UsersController } from '../controllers/users/users.controller';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { GetUsersUseCase } from '../../application/use-cases/users/get-users.use-case';
import { FindUserByEmailUseCase } from '../../application/use-cases/users/find-user-by-email.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/auth/verify-email.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository.interface';
import { ADDRESS_REPOSITORY_TOKEN } from '../../domain/repositories/address.repository.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, OrderEntity, OrderItemEntity, AddressEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PostgresUserRepository,
    },
    {
      provide: ORDER_REPOSITORY_TOKEN,
      useClass: TypeOrmOrderRepository,
    },
    {
      provide: ADDRESS_REPOSITORY_TOKEN,
      useClass: TypeOrmAddressRepository,
    },
    CreateUserUseCase,
    GetUsersUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    VerifyEmailUseCase,
    DeleteUserUseCase,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    USER_REPOSITORY_TOKEN,
    CreateUserUseCase,
    GetUsersUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    VerifyEmailUseCase,
    DeleteUserUseCase,
  ],
})
export class UsersModule { }
