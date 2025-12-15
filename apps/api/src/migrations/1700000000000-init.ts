import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1700000000000 implements MigrationInterface {
  name = 'Init1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar UNIQUE NOT NULL,
        name varchar NOT NULL,
        description text NULL,
        "order" integer DEFAULT 0 NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sku varchar UNIQUE NOT NULL,
        slug varchar UNIQUE NOT NULL,
        name varchar NOT NULL,
        description text NOT NULL,
        "priceCents" integer NOT NULL,
        currency varchar(3) DEFAULT 'EUR' NOT NULL,
        status varchar(20) NOT NULL,
        "thumbnailUrl" text NULL,
        "categoryId" uuid NOT NULL REFERENCES categories(id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS content_blocks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type varchar(50) NOT NULL,
        payload jsonb NULL,
        "order" integer DEFAULT 0 NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar UNIQUE NOT NULL,
        "passwordHash" varchar NOT NULL,
        role varchar(20) DEFAULT 'customer' NOT NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS products;`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories;`);
    await queryRunner.query(`DROP TABLE IF EXISTS content_blocks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
