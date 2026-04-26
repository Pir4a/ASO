import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatSessionOrm } from './chat-session.entity';

export type ChatMessageRole = 'user' | 'assistant' | 'admin';

@Entity({ name: 'chat_messages' })
@Index(['sessionId', 'createdAt'])
export class ChatMessageOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => ChatSessionOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSessionOrm;

  @Column({ type: 'varchar', length: 20 })
  role: ChatMessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
