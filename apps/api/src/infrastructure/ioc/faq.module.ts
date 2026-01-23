import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FAQ } from '../persistence/typeorm/entities/faq.entity';
import { TypeOrmFAQRepository } from '../persistence/typeorm/repositories/faq.repository';
import { FAQ_REPOSITORY_TOKEN } from '../../domain/repositories/faq.repository.interface';
import { GetFAQsUseCase } from '../../application/use-cases/faq/get-faqs.use-case';
import { CreateFAQUseCase } from '../../application/use-cases/faq/create-faq.use-case';
import { UpdateFAQUseCase } from '../../application/use-cases/faq/update-faq.use-case';
import { DeleteFAQUseCase } from '../../application/use-cases/faq/delete-faq.use-case';
import { SearchFAQsUseCase } from '../../application/use-cases/faq/search-faqs.use-case';
import { AdminFAQController } from '../controllers/admin/faq.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FAQ])],
  controllers: [AdminFAQController],
  providers: [
    {
      provide: FAQ_REPOSITORY_TOKEN,
      useClass: TypeOrmFAQRepository,
    },
    GetFAQsUseCase,
    CreateFAQUseCase,
    UpdateFAQUseCase,
    DeleteFAQUseCase,
    SearchFAQsUseCase,
  ],
  exports: [
    FAQ_REPOSITORY_TOKEN,
    GetFAQsUseCase,
    SearchFAQsUseCase,
  ],
})
export class FAQModule { }