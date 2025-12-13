// src/matches/dto/create-teams-random.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTeamsRandomDto {
    @ApiPropertyOptional({ 
        example: 'abc123', 
        description: 'Seed para reproduzir resultado (opcional)' 
    })
    @IsOptional()
    @IsString()
    seed?: string;
}