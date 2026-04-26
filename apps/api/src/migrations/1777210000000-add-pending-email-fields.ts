import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingEmailFields1777210000000 implements MigrationInterface {
    name = 'AddPendingEmailFields1777210000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_email" text NULL;`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_email_token" text NULL;`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_email_expires" timestamptz NULL;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "pending_email_expires";`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "pending_email_token";`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "pending_email";`,
        );
    }
}
