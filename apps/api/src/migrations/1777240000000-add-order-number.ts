import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderNumber1777240000000 implements MigrationInterface {
  name = 'AddOrderNumber1777240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "orderNumber" varchar(32)
    `);

    // Backfill legacy rows with deterministic daily sequence:
    // ALT-YYYYMMDD-XXXX (ordered by createdAt then id for stability).
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          o.id,
          to_char(timezone('UTC', o."createdAt"), 'YYYYMMDD') AS day_key,
          row_number() OVER (
            PARTITION BY to_char(timezone('UTC', o."createdAt"), 'YYYYMMDD')
            ORDER BY o."createdAt" ASC, o.id ASC
          ) AS seq
        FROM orders o
        WHERE o."orderNumber" IS NULL
      )
      UPDATE orders o
      SET "orderNumber" = 'ALT-' || r.day_key || '-' || lpad(r.seq::text, 4, '0')
      FROM ranked r
      WHERE o.id = r.id
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_orders_orderNumber_unique"
      ON "orders" ("orderNumber")
      WHERE "orderNumber" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_orders_orderNumber_unique"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "orderNumber"
    `);
  }
}
