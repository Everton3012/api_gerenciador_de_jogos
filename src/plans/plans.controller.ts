// src/plans/plans.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager'; 
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Plan } from './entities/plan.entity';

const CACHE_TTL_PLANS_LIST = 365 * 24 * 60 * 60; // 1 ano em segundos
const CACHE_TTL_PLANS_COMPARISON = 365 * 24 * 60 * 60; // 1 ano em segundos
const CACHE_TTL_USER_PLAN = 30 * 24 * 60 * 60; // 30 dias em segundos
const CACHE_TTL_UPGRADE_OPTIONS = 7 * 24 * 60 * 60; // 7 dias em segundos
const CACHE_TTL_PLAN_DETAIL = 365 * 24 * 60 * 60; // 1 ano em segundos

@ApiTags('plans')
@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Get()
    @ApiOperation({ summary: 'Listar todos os planos disponíveis' })
    @ApiResponse({ status: 200, description: 'Lista de planos' })
    @CacheTTL(CACHE_TTL_PLANS_LIST)
    async findAll(): Promise<Plan[]> {
        return this.plansService.findAll();
    }

    @Get('compare')
    @ApiOperation({ summary: 'Comparar todos os planos' })
    @ApiResponse({ status: 200, description: 'Comparação de planos' })
    @CacheTTL(CACHE_TTL_PLANS_COMPARISON)
    async comparePlans() {
        return this.plansService.comparePlans();
    }

    @Get('my-plan')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obter plano e limites do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Plano do usuário' })
    @CacheTTL(CACHE_TTL_USER_PLAN)
    async getMyPlan(@CurrentUser() user: User) {
        return this.plansService.getPlanLimits(user.id);
    }

    @Get('upgrade-options')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obter opções de upgrade disponíveis' })
    @ApiResponse({ status: 200, description: 'Planos disponíveis para upgrade' })
    @CacheTTL(CACHE_TTL_UPGRADE_OPTIONS)
    async getUpgradeOptions(@CurrentUser() user: User) {
        return this.plansService.getUpgradeOptions(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter detalhes de um plano específico' })
    @ApiResponse({ status: 200, description: 'Detalhes do plano' })
    @ApiResponse({ status: 404, description: 'Plano não encontrado' })
    @CacheTTL(CACHE_TTL_PLAN_DETAIL)
    async findOne(@Param('id') id: string): Promise<Plan> {
        return this.plansService.findOne(id);
    }
}