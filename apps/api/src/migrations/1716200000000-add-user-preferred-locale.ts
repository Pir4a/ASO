import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPreferredLocale1716200000000 implements MigrationInterface {
  name = 'AddUserPreferredLocale1716200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS preferred_locale varchar(4) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS preferred_locale;
    `);
  }
}
