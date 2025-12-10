// src/plans/plans.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Plan } from './entities/plan.entity';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os planos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de planos' })
  async findAll(): Promise<Plan[]> {
    return this.plansService.findAll();
  }

  @Get('compare')
  @ApiOperation({ summary: 'Comparar todos os planos' })
  @ApiResponse({ status: 200, description: 'Comparação de planos' })
  async comparePlans() {
    return this.plansService.comparePlans();
  }

  @Get('my-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter plano e limites do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Plano do usuário' })
  async getMyPlan(@CurrentUser() user: User) {
    return this.plansService.getPlanLimits(user.id);
  }

  @Get('upgrade-options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter opções de upgrade disponíveis' })
  @ApiResponse({ status: 200, description: 'Planos disponíveis para upgrade' })
  async getUpgradeOptions(@CurrentUser() user: User) {
    return this.plansService.getUpgradeOptions(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um plano específico' })
  @ApiResponse({ status: 200, description: 'Detalhes do plano' })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  async findOne(@Param('id') id: string): Promise<Plan> {
    return this.plansService.findOne(id);
  }
}