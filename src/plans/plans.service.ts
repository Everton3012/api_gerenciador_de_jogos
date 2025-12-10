// src/plans/plans.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { UserPlan } from '../users/enums';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Plan[]> {
    return this.plansRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findOne({
      where: { id, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plano ${id} não encontrado`);
    }

    return plan;
  }

  async getUserPlan(userId: string): Promise<Plan> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'plan'],
    });

    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado`);
    }

    return this.findOne(user.plan);
  }

  async canCreateMatch(userId: string, currentMatchesThisMonth: number): Promise<boolean> {
    const userPlan = await this.getUserPlan(userId);
    const { maxMatchesPerMonth } = userPlan.features;

    // null significa ilimitado
    if (maxMatchesPerMonth === null) {
      return true;
    }

    return currentMatchesThisMonth < maxMatchesPerMonth;
  }

  async canCreateTournament(userId: string, currentTournamentsThisMonth: number): Promise<boolean> {
    const userPlan = await this.getUserPlan(userId);
    const { maxTournamentsPerMonth } = userPlan.features;

    // null significa ilimitado
    if (maxTournamentsPerMonth === null) {
      return true;
    }

    return currentTournamentsThisMonth < maxTournamentsPerMonth;
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const userPlan = await this.getUserPlan(userId);

    const featureMap = {
      advancedStats: userPlan.features.advancedStats,
      knockoutMode: userPlan.features.knockoutMode,
      teamManagement: userPlan.features.teamManagement,
      prioritySupport: userPlan.features.prioritySupport,
    };

    return featureMap[feature] || false;
  }

  async validateMatchCreation(userId: string, currentMatchesThisMonth: number): Promise<void> {
    const canCreate = await this.canCreateMatch(userId, currentMatchesThisMonth);

    if (!canCreate) {
      const userPlan = await this.getUserPlan(userId);
      throw new ForbiddenException(
        `Você atingiu o limite de ${userPlan.features.maxMatchesPerMonth} partidas por mês no plano ${userPlan.name}. Faça upgrade para criar mais partidas.`
      );
    }
  }

  async validateTournamentCreation(userId: string, currentTournamentsThisMonth: number): Promise<void> {
    const canCreate = await this.canCreateTournament(userId, currentTournamentsThisMonth);

    if (!canCreate) {
      const userPlan = await this.getUserPlan(userId);
      throw new ForbiddenException(
        `Você atingiu o limite de ${userPlan.features.maxTournamentsPerMonth} torneios por mês no plano ${userPlan.name}. Faça upgrade para criar mais torneios.`
      );
    }
  }

  async validateFeatureAccess(userId: string, feature: string): Promise<void> {
    const hasAccess = await this.checkFeatureAccess(userId, feature);

    if (!hasAccess) {
      const userPlan = await this.getUserPlan(userId);
      throw new ForbiddenException(
        `A funcionalidade "${feature}" não está disponível no plano ${userPlan.name}. Faça upgrade para ter acesso.`
      );
    }
  }

  async getPlanLimits(userId: string): Promise<{
    plan: string;
    price: number;
    features: {
      maxMatchesPerMonth: number | null;
      maxTournamentsPerMonth: number | null;
      advancedStats: boolean;
      knockoutMode: boolean;
      teamManagement: boolean;
      prioritySupport: boolean;
    };
    usage?: {
      matchesThisMonth?: number;
      tournamentsThisMonth?: number;
    };
  }> {
    const userPlan = await this.getUserPlan(userId);

    return {
      plan: userPlan.name,
      price: userPlan.price,
      features: userPlan.features,
      usage: {
        matchesThisMonth: 0, // TODO: Buscar do banco quando implementar
        tournamentsThisMonth: 0, // TODO: Buscar do banco quando implementar
      },
    };
  }

  async comparePlans(): Promise<Array<{
    id: string;
    name: string;
    price: number;
    features: any;
    recommended?: boolean;
  }>> {
    const plans = await this.findAll();

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      recommended: plan.id === UserPlan.PRO, // PRO é o recomendado
    }));
  }

  async getUpgradeOptions(userId: string): Promise<Plan[]> {
    const currentPlan = await this.getUserPlan(userId);
    const allPlans = await this.findAll();

    const planOrder = {
      [UserPlan.FREE]: 0,
      [UserPlan.BASIC]: 1,
      [UserPlan.PRO]: 2,
      [UserPlan.ENTERPRISE]: 3,
    };

    const currentPlanOrder = planOrder[currentPlan.id];

    // Retornar planos superiores ao atual
    return allPlans.filter(plan => {
      const planOrderValue = planOrder[plan.id];
      return planOrderValue > currentPlanOrder;
    });
  }
}