import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ContentType = 'carousel' | 'homepage_text' | 'category_image';

@Entity({ name: 'content_blocks' })
export class ContentBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: ContentType;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  order: number;
}
