// src/plans/plans.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
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
        private readonly i18n: I18nService,
    ) { }

    async findAll(): Promise<Plan[]> {
        return this.plansRepository.find({
            where: { isActive: true },
            order: { price: 'ASC' },
        });
    }

    async findOne(id: string, lang?: string): Promise<Plan> {
        const plan = await this.plansRepository.findOne({
            where: { id, isActive: true },
        });

        if (!plan) {
            throw new NotFoundException(
                await this.i18n.translate('plans.PLAN_NOT_FOUND', {
                    lang,
                    args: { id },
                }),
            );
        }

        return plan;
    }

    async getUserPlan(userId: string, lang?: string): Promise<Plan> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'plan'],
        });

        if (!user) {
            throw new NotFoundException(
                await this.i18n.translate('users.USER_NOT_FOUND', {
                    lang,
                    args: { id: userId },
                }),
            );
        }

        return this.findOne(user.plan, lang);
    }

    async canCreateMatch(userId: string, currentMatchesThisMonth: number, lang?: string): Promise<boolean> {
        const userPlan = await this.getUserPlan(userId, lang);
        const { maxMatchesPerMonth } = userPlan.features;

        // null significa ilimitado
        if (maxMatchesPerMonth === null) {
            return true;
        }

        return currentMatchesThisMonth < maxMatchesPerMonth;
    }

    async canCreateTournament(userId: string, currentTournamentsThisMonth: number, lang?: string): Promise<boolean> {
        const userPlan = await this.getUserPlan(userId, lang);
        const { maxTournamentsPerMonth } = userPlan.features;

        // null significa ilimitado
        if (maxTournamentsPerMonth === null) {
            return true;
        }

        return currentTournamentsThisMonth < maxTournamentsPerMonth;
    }

    async checkFeatureAccess(userId: string, feature: string, lang?: string): Promise<boolean> {
        const userPlan = await this.getUserPlan(userId, lang);

        const featureMap = {
            advancedStats: userPlan.features.advancedStats,
            knockoutMode: userPlan.features.knockoutMode,
            teamManagement: userPlan.features.teamManagement,
            prioritySupport: userPlan.features.prioritySupport,
        };

        return featureMap[feature] || false;
    }

    async validateMatchCreation(userId: string, currentMatchesThisMonth: number, lang?: string): Promise<void> {
        const canCreate = await this.canCreateMatch(userId, currentMatchesThisMonth, lang);

        if (!canCreate) {
            const userPlan = await this.getUserPlan(userId, lang);
            throw new ForbiddenException(
                await this.i18n.translate('plans.MATCH_LIMIT_REACHED', {
                    lang,
                    args: {
                        limit: userPlan.features.maxMatchesPerMonth,
                        plan: userPlan.name,
                    },
                }),
            );
        }
    }

    async validateTournamentCreation(userId: string, currentTournamentsThisMonth: number, lang?: string): Promise<void> {
        const canCreate = await this.canCreateTournament(userId, currentTournamentsThisMonth, lang);

        if (!canCreate) {
            const userPlan = await this.getUserPlan(userId, lang);
            throw new ForbiddenException(
                await this.i18n.translate('plans.TOURNAMENT_LIMIT_REACHED', {
                    lang,
                    args: {
                        limit: userPlan.features.maxTournamentsPerMonth,
                        plan: userPlan.name,
                    },
                }),
            );
        }
    }

    async validateFeatureAccess(userId: string, feature: string, lang?: string): Promise<void> {
        const hasAccess = await this.checkFeatureAccess(userId, feature, lang);

        if (!hasAccess) {
            const userPlan = await this.getUserPlan(userId, lang);
            throw new ForbiddenException(
                await this.i18n.translate('plans.FEATURE_NOT_AVAILABLE', {
                    lang,
                    args: {
                        feature,
                        plan: userPlan.name,
                    },
                }),
            );
        }
    }

    async getPlanLimits(userId: string, lang?: string): Promise<{
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
        const userPlan = await this.getUserPlan(userId, lang);

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
            recommended: plan.id === UserPlan.PRO,
        }));
    }

    async getUpgradeOptions(userId: string, lang?: string): Promise<Plan[]> {
        const currentPlan = await this.getUserPlan(userId, lang);
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