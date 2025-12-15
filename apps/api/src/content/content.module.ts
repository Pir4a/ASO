import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentBlock } from '../entities/content-block.entity';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { Media, MediaSchema } from './media.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentBlock]),
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
