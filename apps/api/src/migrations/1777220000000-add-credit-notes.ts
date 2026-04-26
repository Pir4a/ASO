import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditNotes1777220000000 implements MigrationInterface {
  name = 'AddCreditNotes1777220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS credit_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        number varchar(40) UNIQUE NOT NULL,
        "invoiceId" uuid NOT NULL,
        "userId" uuid NULL,
        "amountTtcCents" integer NOT NULL,
        currency varchar(3) NOT NULL DEFAULT 'EUR',
        reason varchar(20) NOT NULL DEFAULT 'cancellation',
        "issuedAt" timestamptz NOT NULL DEFAULT now(),
        "pdfUrl" text NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_credit_notes_number ON credit_notes(number);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON credit_notes("invoiceId");
    `);

    // Best-effort FK to invoices if the table exists (created by Unit 2 migration).
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
          BEGIN
            ALTER TABLE credit_notes
              ADD CONSTRAINT fk_credit_notes_invoice
              FOREIGN KEY ("invoiceId") REFERENCES invoices(id) ON DELETE CASCADE;
          EXCEPTION WHEN duplicate_object THEN NULL;
          END;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
          BEGIN
            ALTER TABLE credit_notes
              ADD CONSTRAINT fk_credit_notes_user
              FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL;
          EXCEPTION WHEN duplicate_object THEN NULL;
          END;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS credit_notes;`);
  }
}
