import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMatchesAndTeamsTables1765555094496 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar enum de status da partida
        await queryRunner.query(`
          CREATE TYPE match_status_enum AS ENUM ('pending', 'waiting_teams', 'in_progress', 'finished');
        `);

        // Criar enum de modo de formação de equipes
        await queryRunner.query(`
          CREATE TYPE team_formation_mode_enum AS ENUM ('manual', 'random');
        `);

        // Criar tabela de partidas
        await queryRunner.createTable(
            new Table({
                name: 'matches',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'gameId',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'status',
                        type: 'match_status_enum',
                        default: "'waiting_teams'",
                    },
                    {
                        name: 'teamFormationMode',
                        type: 'team_formation_mode_enum',
                        default: "'manual'",
                    },
                    {
                        name: 'teamCount',
                        type: 'integer',
                        default: 2,
                    },
                    {
                        name: 'createdById',
                        type: 'uuid',
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

        // Criar foreign key para createdBy
        await queryRunner.createForeignKey(
            'matches',
            new TableForeignKey({
                columnNames: ['createdById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Criar tabela de junção match_players
        await queryRunner.createTable(
            new Table({
                name: 'match_players',
                columns: [
                    {
                        name: 'matchId',
                        type: 'uuid',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                ],
            }),
            true,
        );

        // Foreign keys para match_players
        await queryRunner.createForeignKey(
            'match_players',
            new TableForeignKey({
                columnNames: ['matchId'],
                referencedTableName: 'matches',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'match_players',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Criar tabela de equipes
        await queryRunner.createTable(
            new Table({
                name: 'teams',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'matchId',
                        type: 'uuid',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Foreign key para teams
        await queryRunner.createForeignKey(
            'teams',
            new TableForeignKey({
                columnNames: ['matchId'],
                referencedTableName: 'matches',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Criar tabela de junção team_players
        await queryRunner.createTable(
            new Table({
                name: 'team_players',
                columns: [
                    {
                        name: 'teamId',
                        type: 'uuid',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                ],
            }),
            true,
        );

        // Foreign keys para team_players
        await queryRunner.createForeignKey(
            'team_players',
            new TableForeignKey({
                columnNames: ['teamId'],
                referencedTableName: 'teams',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'team_players',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('team_players');
        await queryRunner.dropTable('teams');
        await queryRunner.dropTable('match_players');
        await queryRunner.dropTable('matches');
        await queryRunner.query(`DROP TYPE match_status_enum`);
        await queryRunner.query(`DROP TYPE team_formation_mode_enum`);
    }
}