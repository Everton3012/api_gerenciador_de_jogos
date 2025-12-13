// src/matches/dto/update-match.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '../enums';

export class UpdateMatchDto {
    @ApiProperty({
        enum: MatchStatus,
        example: MatchStatus.IN_PROGRESS,
        description: 'Status da partida',
        required: false,
    })
    @IsOptional()
    @IsEnum(MatchStatus)
    status?: MatchStatus;
}