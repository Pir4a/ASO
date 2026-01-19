import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User as UserEntity } from '../persistence/typeorm/entities/user.entity';
import { PostgresUserRepository } from '../persistence/typeorm/repositories/postgres-user.repository';
import { UsersController } from '../controllers/users/users.controller';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { GetUsersUseCase } from '../../application/use-cases/users/get-users.use-case';
import { FindUserByEmailUseCase } from '../../application/use-cases/users/find-user-by-email.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
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
  ],
  exports: [
    CreateUserUseCase,
    GetUsersUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
  ],
})
export class UsersModule { }
