import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MessageType = 'user' | 'bot' | 'system';
export type ConversationStatus = 'active' | 'escalated' | 'closed';

@Entity({ name: 'chat_conversations' })
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sessionId: string; // Anonymous user session

  @Column({ nullable: true })
  userId: string; // If user is logged in

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  type: MessageType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>; // FAQ ID, escalation info, etc.

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ConversationStatus;

  @Column({ nullable: true })
  escalatedTo?: string; // Admin user ID if escalated

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}