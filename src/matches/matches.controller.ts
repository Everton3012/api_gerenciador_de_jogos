// src/matches/matches.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CreateTeamsManualDto } from './dto/create-teams-manual.dto';
import { CreateTeamsRandomDto } from './dto/create-teams-random.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const CACHE_TTL_MATCHES_LIST = 3 * 60; // 3 minutos em segundos
const CACHE_TTL_MATCH_DETAIL = 3 * 60; // 3 minutos em segundos

@ApiTags('matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) { }

    @Post()
    @ApiOperation({ summary: 'Criar uma nova partida' })
    @ApiResponse({ status: 201, description: 'Partida criada com sucesso' })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    create(@Body() createMatchDto: CreateMatchDto, @Request() req) {
        return this.matchesService.create(createMatchDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas as partidas' })
    @ApiResponse({ status: 200, description: 'Lista de partidas' })
    @CacheTTL(CACHE_TTL_MATCHES_LIST)
    findAll() {
        return this.matchesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter detalhes de uma partida' })
    @ApiResponse({ status: 200, description: 'Detalhes da partida' })
    @ApiResponse({ status: 404, description: 'Partida não encontrada' })
    @CacheTTL(CACHE_TTL_MATCH_DETAIL)
    findOne(@Param('id') id: string) {
        return this.matchesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar status da partida' })
    @ApiResponse({ status: 200, description: 'Partida atualizada' })
    @ApiResponse({ status: 404, description: 'Partida não encontrada' })
    update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
        return this.matchesService.update(id, updateMatchDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remover uma partida' })
    @ApiResponse({ status: 204, description: 'Partida removida' })
    @ApiResponse({ status: 404, description: 'Partida não encontrada' })
    remove(@Param('id') id: string) {
        return this.matchesService.remove(id);
    }

    @Post(':id/teams')
    @ApiOperation({ summary: 'Criar equipes manualmente' })
    @ApiResponse({ status: 201, description: 'Equipes criadas com sucesso' })
    @ApiResponse({ status: 400, description: 'Validação falhou' })
    @ApiResponse({ status: 404, description: 'Partida não encontrada' })
    createTeamsManual(
        @Param('id') id: string,
        @Body() createTeamsDto: CreateTeamsManualDto,
    ) {
        return this.matchesService.createTeamsManual(id, createTeamsDto);
    }

    @Post(':id/teams/random')
    @ApiOperation({ summary: 'Criar equipes aleatoriamente' })
    @ApiResponse({ status: 201, description: 'Equipes criadas aleatoriamente' })
    @ApiResponse({ status: 400, description: 'Validação falhou' })
    @ApiResponse({ status: 404, description: 'Partida não encontrada' })
    createTeamsRandom(
        @Param('id') id: string,
        @Body() createTeamsDto: CreateTeamsRandomDto,
    ) {
        return this.matchesService.createTeamsRandom(id);
    }
}