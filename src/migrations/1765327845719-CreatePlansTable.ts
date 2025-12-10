// src/migrations/1765327845719-CreatePlansTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePlansTable1765327845719 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de planos
    await queryRunner.createTable(
      new Table({
        name: 'plans',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '20',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'price',
            type: 'integer',
            default: 0,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
          },
          {
            name: 'features',
            type: 'jsonb',
          },
          {
            name: 'isEnterprise',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Inserir planos padrão
    await queryRunner.query(`
      INSERT INTO plans (id, name, price, currency, features, "isEnterprise", "isActive") VALUES
      (
        'free',
        'Free',
        0,
        'BRL',
        '{"maxMatchesPerMonth": 10, "maxTournamentsPerMonth": 1, "advancedStats": false, "knockoutMode": false, "teamManagement": false, "prioritySupport": false}'::jsonb,
        false,
        true
      ),
      (
        'basic',
        'Basic',
        1990,
        'BRL',
        '{"maxMatchesPerMonth": 50, "maxTournamentsPerMonth": 5, "advancedStats": false, "knockoutMode": true, "teamManagement": false, "prioritySupport": false}'::jsonb,
        false,
        true
      ),
      (
        'pro',
        'Pro',
        3990,
        'BRL',
        '{"maxMatchesPerMonth": null, "maxTournamentsPerMonth": null, "advancedStats": true, "knockoutMode": true, "teamManagement": true, "prioritySupport": false}'::jsonb,
        false,
        true
      ),
      (
        'enterprise',
        'Enterprise',
        0,
        'BRL',
        '{"maxMatchesPerMonth": null, "maxTournamentsPerMonth": null, "advancedStats": true, "knockoutMode": true, "teamManagement": true, "prioritySupport": true}'::jsonb,
        true,
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('plans');
  }
}