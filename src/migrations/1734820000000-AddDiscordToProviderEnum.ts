// src/database/migrations/1734820000000-AddDiscordToProviderEnum.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscordToProviderEnum1734820000000 implements MigrationInterface {
  name = 'AddDiscordToProviderEnum1734820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar 'discord' ao enum existente
    await queryRunner.query(`
      ALTER TYPE "users_provider_enum" ADD VALUE IF NOT EXISTS 'discord';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL não permite remover valores de enum
    // Esta migração é irreversível
  }
}