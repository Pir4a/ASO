import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsReadToContactMessages1777240000000 implements MigrationInterface {
  name = 'AddIsReadToContactMessages1777240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CDC XVI.1 — the BO sidebar badge must reflect only unread contact
    // messages. We add an explicit boolean (default false so any existing row
    // is treated as "non traité" the first time an admin loads the panel).
    await queryRunner.query(
      `ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "is_read" boolean NOT NULL DEFAULT false;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contact_messages_is_read" ON "contact_messages" ("is_read");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_messages_is_read";`);
    await queryRunner.query(
      `ALTER TABLE "contact_messages" DROP COLUMN IF EXISTS "is_read";`,
    );
  }
}
