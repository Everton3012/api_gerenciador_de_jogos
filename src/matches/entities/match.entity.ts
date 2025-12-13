// src/matches/entities/match.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from './team.entity';
import { MatchStatus, TeamFormationMode } from '../enums';

@Entity('matches')
export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    gameId: string;

    @Column({
        type: 'enum',
        enum: MatchStatus,
        default: MatchStatus.WAITING_TEAMS,
    })
    status: MatchStatus;

    @Column({
        type: 'enum',
        enum: TeamFormationMode,
        default: TeamFormationMode.MANUAL,
    })
    teamFormationMode: TeamFormationMode;

    @Column({ type: 'int', default: 2 })
    teamCount: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @Column({ type: 'uuid' })
    createdById: string;

    @ManyToMany(() => User, { eager: true })
    @JoinTable({
        name: 'match_players',
        joinColumn: { name: 'matchId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    players: User[];

    @OneToMany(() => Team, (team) => team.match, { cascade: true })
    teams: Team[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}