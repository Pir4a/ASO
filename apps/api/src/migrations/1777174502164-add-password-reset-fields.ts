import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFields1777174502164 implements MigrationInterface {
  name = 'AddPasswordResetFields1777174502164';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" text NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token_expires" timestamptz NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "password_reset_token_expires";`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "password_reset_token";`,
    );
  }
}
