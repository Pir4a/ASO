import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatTables1777230000000 implements MigrationInterface {
  name = 'AddChatTables1777230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        "guestEmail" varchar(160) NULL,
        subject varchar(160) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'open',
        "escalatedAt" timestamptz NULL,
        "lastActivityAt" timestamptz NOT NULL DEFAULT now(),
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_status_last_activity
      ON chat_sessions (status, "lastActivityAt" DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionId" uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role varchar(20) NOT NULL,
        content text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
      ON chat_messages ("sessionId", "createdAt" ASC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_messages_session_created;`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_messages;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_sessions_status_last_activity;`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_sessions;`);
  }
}
