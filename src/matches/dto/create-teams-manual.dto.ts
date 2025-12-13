// src/matches/dto/create-teams-manual.dto.ts
import { IsString, IsArray, ArrayMinSize, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TeamDto {
    @ApiProperty({ example: 'Time A', description: 'Nome da equipe' })
    @IsString()
    name: string;

    @ApiProperty({ example: ['uuid-user1', 'uuid-user2'], description: 'IDs dos jogadores' })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    players: string[];
}

export class CreateTeamsManualDto {
    @ApiProperty({
        type: [TeamDto],
        description: 'Lista de equipes com seus jogadores',
    })
    @IsArray()
    @ArrayMinSize(2)
    @ValidateNested({ each: true })
    @Type(() => TeamDto)
    teams: TeamDto[];
}