import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentBlock } from '../persistence/typeorm/entities/content-block.entity';
import { ContentController } from '../controllers/content/content.controller';
import { GetContentUseCase } from '../../application/use-cases/content/get-content.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthModule } from './auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([ContentBlock]), AuthModule],
    controllers: [ContentController],
    providers: [GetContentUseCase, JwtAuthGuard, RolesGuard],
})
export class ContentModule { }
