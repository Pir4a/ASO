import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    Header,
    NotFoundException,
    Param,
    Post,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { MediaService } from '../services/media.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = /^image\/(jpe?g|png|gif|webp|avif|svg\+xml)$/i;

@Controller()
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    /** Admin-only upload. Multipart 'file' field, max 5 MB, image/* mime types. */
    @Post('admin/media')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: MAX_BYTES, files: 1 },
        }),
    )
    async upload(@UploadedFile() file?: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file received.');
        if (!file.mimetype || !ALLOWED_MIME.test(file.mimetype)) {
            throw new BadRequestException('Unsupported MIME type — image/* only.');
        }
        if (file.size > MAX_BYTES) {
            throw new BadRequestException('File too large (max 5 MB).');
        }
        const result = await this.mediaService.upload({
            buffer: file.buffer,
            filename: file.originalname || `upload-${Date.now()}`,
            mime: file.mimetype,
        });
        return result;
    }

    /** Public stream — image rendering on the storefront and BO. */
    @Get('media/:id')
    @Header('Cache-Control', 'public, max-age=31536000, immutable')
    async stream(@Param('id') id: string, @Res() res: Response) {
        const metadata = await this.mediaService.metadata(id);
        res.setHeader('Content-Type', metadata.mime);
        res.setHeader('Content-Length', metadata.size.toString());
        const readable = this.mediaService.stream(id);
        readable.on('error', (err) => {
            // Most likely "file not found"; fall back to 404 if headers haven't been sent.
            if (!res.headersSent) {
                res.status(404).json({ message: 'Media not found.' });
            } else {
                res.end();
            }
        });
        readable.pipe(res);
    }

    /** Admin-only delete. */
    @Delete('admin/media/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async delete(@Param('id') id: string) {
        try {
            await this.mediaService.delete(id);
            return { ok: true };
        } catch (e) {
            if (e instanceof NotFoundException) throw e;
            throw e;
        }
    }
}
