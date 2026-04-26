import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoices1777200000000 implements MigrationInterface {
    name = 'AddInvoices1777200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "number" varchar(32) NOT NULL,
        "orderId" uuid NOT NULL,
        "userId" uuid NULL,
        "totalHtCents" integer NOT NULL,
        "totalTvaCents" integer NOT NULL,
        "totalTtcCents" integer NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'EUR',
        "status" varchar(16) NOT NULL DEFAULT 'paid',
        "issuedAt" timestamptz NOT NULL,
        "pdfUrl" text NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_number" UNIQUE ("number")
      );
    `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_invoices_orderId" ON "invoices" ("orderId");`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_orderId";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "invoices";`);
    }
}
