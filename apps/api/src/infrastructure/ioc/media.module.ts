import { Module } from '@nestjs/common';
import { MediaController } from '../controllers/media.controller';
import { MediaService } from '../services/media.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthModule } from './auth.module';

@Module({
    imports: [AuthModule],
    controllers: [MediaController],
    providers: [MediaService, JwtAuthGuard, RolesGuard],
    exports: [MediaService],
})
export class MediaModule { }
