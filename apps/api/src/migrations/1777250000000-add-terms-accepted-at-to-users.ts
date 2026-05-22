import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTermsAcceptedAtToUsers1777250000000 implements MigrationInterface {
  name = 'AddTermsAcceptedAtToUsers1777250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CDC §XI / CNIL — record the moment the user accepted the CGU + privacy
    // notice on signup. Existing rows are back-filled with `created_at` so the
    // audit trail is not retroactively empty for accounts created before this
    // column existed.
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamptz NULL;`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "terms_accepted_at" = "createdAt" WHERE "terms_accepted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "terms_accepted_at";`,
    );
  }
}
