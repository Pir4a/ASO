import { Controller, Get } from '@nestjs/common';
import { GetCategoriesUseCase } from '../../../application/use-cases/categories/get-categories.use-case';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly getCategoriesUseCase: GetCategoriesUseCase) { }

    @Get()
    findAll() {
        return this.getCategoriesUseCase.execute();
    }
}
