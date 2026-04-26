import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ChatSessionStatus = 'open' | 'closed' | 'escalated';

@Entity({ name: 'chat_sessions' })
@Index(['status', 'lastActivityAt'])
export class ChatSessionOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  guestEmail: string | null;

  @Column({ type: 'varchar', length: 160 })
  subject: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: ChatSessionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  escalatedAt: Date | null;

  @Column({ type: 'timestamptz' })
  lastActivityAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
