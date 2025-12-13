// src/matches/matches.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { Match } from './entities/match.entity';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { CreateTeamsManualDto } from './dto/create-teams-manual.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchStatus } from './enums';

@Injectable()
export class MatchesService {
    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        @InjectRepository(Team)
        private teamsRepository: Repository<Team>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private readonly i18n: I18nService,
    ) { }

    async create(createMatchDto: CreateMatchDto, createdById: string, lang?: string): Promise<Match> {
        const players = await this.usersRepository.findBy({
            id: In(createMatchDto.players),
        });

        if (players.length !== createMatchDto.players.length) {
            throw new BadRequestException(
                await this.i18n.translate('matches.INVALID_PLAYERS', { lang }),
            );
        }

        const match = this.matchesRepository.create({
            gameId: createMatchDto.gameId,
            teamFormationMode: createMatchDto.teamFormationMode,
            teamCount: createMatchDto.teamCount,
            createdById,
            players,
            status: MatchStatus.WAITING_TEAMS,
        });

        return this.matchesRepository.save(match);
    }

    async findAll(): Promise<Match[]> {
        return this.matchesRepository.find({
            relations: ['createdBy', 'players', 'teams', 'teams.players'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, lang?: string): Promise<Match> {
        const match = await this.matchesRepository.findOne({
            where: { id },
            relations: ['createdBy', 'players', 'teams', 'teams.players'],
        });

        if (!match) {
            throw new NotFoundException(
                await this.i18n.translate('matches.MATCH_NOT_FOUND', { lang, args: { id } }),
            );
        }

        return match;
    }

    async update(id: string, updateMatchDto: UpdateMatchDto, lang?: string): Promise<Match> {
        const match = await this.findOne(id, lang);
        Object.assign(match, updateMatchDto);
        return this.matchesRepository.save(match);
    }

    async remove(id: string, lang?: string): Promise<void> {
        const match = await this.findOne(id, lang);
        await this.matchesRepository.remove(match);
    }

    async createTeamsManual(
        matchId: string,
        createTeamsDto: CreateTeamsManualDto,
        lang?: string,
    ): Promise<Team[]> {
        const match = await this.matchesRepository.findOne({
            where: { id: matchId },
            relations: ['players'],
        });

        if (!match) {
            throw new NotFoundException(
                await this.i18n.translate('matches.MATCH_NOT_FOUND', { lang, args: { id: matchId } }),
            );
        }

        // ✅ Verificar teams via query RAW
        const existingTeamsResult = await this.teamsRepository.query(
            `SELECT COUNT(*) as count FROM teams WHERE "matchId" = $1`,
            [match.id]
        );
        const existingTeams = parseInt(existingTeamsResult[0].count);

        if (existingTeams > 0) {
            throw new BadRequestException(
                await this.i18n.translate('matches.TEAMS_ALREADY_CREATED', { lang }),
            );
        }

        if (match.status !== MatchStatus.WAITING_TEAMS) {
            throw new BadRequestException(
                await this.i18n.translate('matches.MATCH_ALREADY_STARTED', { lang }),
            );
        }

        if (createTeamsDto.teams.length !== match.teamCount) {
            throw new BadRequestException(
                await this.i18n.translate('matches.INVALID_TEAM_COUNT', {
                    lang,
                    args: { expected: match.teamCount, received: createTeamsDto.teams.length },
                }),
            );
        }

        const allPlayerIds = createTeamsDto.teams.flatMap((team) => team.players);
        const matchPlayerIds = match.players.map((p) => p.id);

        const invalidPlayers = allPlayerIds.filter((id) => !matchPlayerIds.includes(id));
        if (invalidPlayers.length > 0) {
            throw new BadRequestException(
                await this.i18n.translate('matches.PLAYERS_NOT_IN_MATCH', { lang }),
            );
        }

        const uniquePlayers = new Set(allPlayerIds);
        if (uniquePlayers.size !== allPlayerIds.length) {
            throw new BadRequestException(
                await this.i18n.translate('matches.DUPLICATE_PLAYERS', { lang }),
            );
        }

        if (uniquePlayers.size !== matchPlayerIds.length) {
            throw new BadRequestException(
                await this.i18n.translate('matches.MISSING_PLAYERS', { lang }),
            );
        }

        // ✅ CRIAR EQUIPES USANDO QUERY RAW
        const teams: Team[] = [];
        for (const teamDto of createTeamsDto.teams) {
            // 1. Inserir team diretamente no banco
            const insertResult = await this.teamsRepository.query(
                `INSERT INTO teams (name, "matchId") VALUES ($1, $2) RETURNING id, name, "matchId", "createdAt"`,
                [teamDto.name, match.id]
            );
            const savedTeam = insertResult[0];

            // 2. Inserir relação many-to-many com players
            for (const playerId of teamDto.players) {
                await this.teamsRepository.query(
                    `INSERT INTO team_players ("teamId", "userId") VALUES ($1, $2)`,
                    [savedTeam.id, playerId]
                );
            }

            // 3. Buscar players manualmente via query
            const players = await this.usersRepository.query(
                `SELECT u.* FROM users u 
                 INNER JOIN team_players tp ON u.id = tp."userId" 
                 WHERE tp."teamId" = $1`,
                [savedTeam.id]
            );

            // Montar objeto Team manualmente
            teams.push({
                id: savedTeam.id,
                name: savedTeam.name,
                players: players,
                createdAt: savedTeam.createdAt,
            } as Team);
        }

        match.status = MatchStatus.IN_PROGRESS;
        await this.matchesRepository.save(match);

        return teams;
    }

    // Substituir o método createTeamsRandom (linhas 192-270)

    async createTeamsRandom(matchId: string, lang?: string): Promise<Team[]> {


        const match = await this.matchesRepository.findOne({
            where: { id: matchId },
            relations: ['players'],
        });



        if (!match) {

            throw new NotFoundException(
                await this.i18n.translate('matches.MATCH_NOT_FOUND', { lang, args: { id: matchId } }),
            );
        }

        const existingTeamsResult = await this.teamsRepository.query(
            `SELECT COUNT(*) as count FROM teams WHERE "matchId" = $1`,
            [match.id]
        );
        const existingTeams = parseInt(existingTeamsResult[0].count);



        if (existingTeams > 0) {

            throw new BadRequestException(
                await this.i18n.translate('matches.TEAMS_ALREADY_CREATED', { lang }),
            );
        }

        if (match.status !== MatchStatus.WAITING_TEAMS) {
            throw new BadRequestException(
                await this.i18n.translate('matches.MATCH_ALREADY_STARTED', { lang }),
            );
        }


        const shuffledPlayers = this.shuffleArray([...match.players]);
        const playersPerTeam = Math.floor(shuffledPlayers.length / match.teamCount);
        const teams: Team[] = [];

        for (let i = 0; i < match.teamCount; i++) {
            const start = i * playersPerTeam;
            const end = i === match.teamCount - 1 ? shuffledPlayers.length : start + playersPerTeam;
            const teamPlayers = shuffledPlayers.slice(start, end);

            // 1. Inserir team diretamente
            const insertResult = await this.teamsRepository.query(
                `INSERT INTO teams (name, "matchId") VALUES ($1, $2) RETURNING id, name, "matchId", "createdAt"`,
                [`Team ${i + 1}`, match.id]
            );
            const savedTeam = insertResult[0];

            // 2. Inserir players
            for (const player of teamPlayers) {
                await this.teamsRepository.query(
                    `INSERT INTO team_players ("teamId", "userId") VALUES ($1, $2)`,
                    [savedTeam.id, player.id]
                );
            }

            // 3. Buscar players manualmente via query
            const players = await this.usersRepository.query(
                `SELECT u.* FROM users u 
             INNER JOIN team_players tp ON u.id = tp."userId" 
             WHERE tp."teamId" = $1`,
                [savedTeam.id]
            );

            // Montar objeto Team manualmente
            teams.push({
                id: savedTeam.id,
                name: savedTeam.name,
                players: players,
                createdAt: savedTeam.createdAt,
            } as Team);
        }



        match.status = MatchStatus.IN_PROGRESS;
        await this.matchesRepository.save(match);


        return teams;
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}