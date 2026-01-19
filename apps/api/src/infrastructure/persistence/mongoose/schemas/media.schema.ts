import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'media_assets', timestamps: true })
export class Media extends Document {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  length: number;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
