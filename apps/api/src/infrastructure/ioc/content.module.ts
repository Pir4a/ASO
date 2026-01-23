import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentBlock } from '../persistence/typeorm/entities/content-block.entity';
import { ContentController } from '../controllers/content/content.controller';
import { AdminContentController } from '../controllers/admin/content.controller';
import { GetContentUseCase } from '../../application/use-cases/content/get-content.use-case';
import { CreateContentBlockUseCase } from '../../application/use-cases/content/create-content-block.use-case';
import { UpdateContentBlockUseCase } from '../../application/use-cases/content/update-content-block.use-case';
import { DeleteContentBlockUseCase } from '../../application/use-cases/content/delete-content-block.use-case';
import { UpdateHomepageContentUseCase } from '../../application/use-cases/content/update-homepage-content.use-case';

@Module({
    imports: [TypeOrmModule.forFeature([ContentBlock])],
    controllers: [ContentController, AdminContentController],
    providers: [
        GetContentUseCase,
        CreateContentBlockUseCase,
        UpdateContentBlockUseCase,
        DeleteContentBlockUseCase,
        UpdateHomepageContentUseCase,
    ],
    exports: [
        GetContentUseCase,
        CreateContentBlockUseCase,
        UpdateContentBlockUseCase,
        DeleteContentBlockUseCase,
        UpdateHomepageContentUseCase,
    ],
})
export class ContentModule { }
