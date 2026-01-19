import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentBlock } from '../persistence/typeorm/entities/content-block.entity';
import { ContentController } from '../controllers/content/content.controller';
import { GetContentUseCase } from '../../application/use-cases/content/get-content.use-case';

@Module({
    imports: [TypeOrmModule.forFeature([ContentBlock])],
    controllers: [ContentController],
    providers: [GetContentUseCase],
})
export class ContentModule { }
