// src/matches/dto/create-match.dto.ts
import { IsString, IsEnum, IsInt, Min, IsArray, ArrayMinSize, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamFormationMode } from '../enums';

export class CreateMatchDto {
    @ApiProperty({ example: 'uuid-do-jogo', description: 'ID do jogo' })
    @IsString()
    gameId: string;

    @ApiProperty({
        enum: TeamFormationMode,
        example: TeamFormationMode.MANUAL,
        description: 'Modo de formação de equipes',
    })
    @IsEnum(TeamFormationMode)
    teamFormationMode: TeamFormationMode;

    @ApiProperty({ example: 2, description: 'Número de equipes', minimum: 2 })
    @IsInt()
    @Min(2)
    teamCount: number;

    @ApiProperty({
        example: ['uuid-user1', 'uuid-user2', 'uuid-user3', 'uuid-user4'],
        description: 'Lista de IDs dos jogadores',
    })
    @IsArray()
    @ArrayMinSize(2)
    @IsUUID('4', { each: true })
    players: string[];
}