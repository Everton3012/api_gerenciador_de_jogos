import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1765225200000 implements MigrationInterface {
    name = 'CreateUsersTable1765225200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar enums
        await queryRunner.query(`
            CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google', 'facebook')
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."users_plan_enum" AS ENUM('free', 'premium')
        `);

        // Criar tabela users
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying,
                "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local',
                "providerId" character varying(255),
                "avatarUrl" character varying(500),
                "emailVerified" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
                "plan" "public"."users_plan_enum" NOT NULL DEFAULT 'free',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Criar índices
        await queryRunner.query(`
            CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_ae9a93b13bce1425823c8ecd07" ON "users" ("provider", "providerId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_409a0298fdd86a6495e23c25c6" ON "users" ("isActive")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_4159e9a8cbcd02fbcf49ef6075" ON "users" ("plan")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Dropar índices
        await queryRunner.query(`DROP INDEX "public"."IDX_4159e9a8cbcd02fbcf49ef6075"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_409a0298fdd86a6495e23c25c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae9a93b13bce1425823c8ecd07"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);

        // Dropar tabela
        await queryRunner.query(`DROP TABLE "users"`);

        // Dropar enums
        await queryRunner.query(`DROP TYPE "public"."users_plan_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    }
}