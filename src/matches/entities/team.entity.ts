// src/matches/entities/team.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { User } from '../../users/entities/user.entity';

@Entity('teams')
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @ManyToOne(() => Match, (match) => match.teams, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'matchId' })
    match: Match;

    @ManyToMany(() => User)
    @JoinTable({
        name: 'team_players',
        joinColumn: { name: 'teamId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    players: User[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}