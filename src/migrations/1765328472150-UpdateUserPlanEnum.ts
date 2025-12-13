import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserPlanEnum1765328472150 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // IMPORTANTE: Não pode estar dentro de uma transação para funcionar
    // O TypeORM executa migrations em transações por padrão

    // Adicionar novos valores ao enum (fora da transação)
    await queryRunner.commitTransaction();

    await queryRunner.query(`ALTER TYPE users_plan_enum ADD VALUE IF NOT EXISTS 'basic'`);
    await queryRunner.query(`ALTER TYPE users_plan_enum ADD VALUE IF NOT EXISTS 'pro'`);
    await queryRunner.query(`ALTER TYPE users_plan_enum ADD VALUE IF NOT EXISTS 'enterprise'`);

    // Iniciar nova transação para o resto
    await queryRunner.startTransaction();

    // Atualizar valores antigos (se houver usuários com 'premium')
    await queryRunner.query(`UPDATE users SET plan = 'pro' WHERE plan = 'premium'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter usuários para free
    await queryRunner.query(`UPDATE users SET plan = 'free' WHERE plan IN ('basic', 'pro', 'enterprise')`);
  }


}
