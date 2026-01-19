import { Controller, Get } from '@nestjs/common';
import { GetContentUseCase } from '../../../application/use-cases/content/get-content.use-case';

@Controller('content')
export class ContentController {
    constructor(private readonly getContentUseCase: GetContentUseCase) { }

    @Get()
    findAll() {
        return this.getContentUseCase.execute();
    }
}
