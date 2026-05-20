import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'contact_messages' })
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  subject: string;

  @Column({ type: 'varchar', length: 120 })
  email: string;

  @Column({ type: 'text' })
  message: string;

  // CDC XVI.1 — BO sidebar must show "non traités" count, so each row needs an
  // explicit read flag (defaults to false so historical rows surface as unread).
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
