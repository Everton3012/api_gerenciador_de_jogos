// src/plans/plans.service.ts
import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { I18nService } from 'nestjs-i18n';
import { Plan } from './entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { UserPlan } from '../users/enums';

const CACHE_TTL_PLANS_LIST = 365 * 24 * 60 * 60; // 1 ano em segundos
const CACHE_TTL_PLAN_DETAIL = 365 * 24 * 60 * 60; // 1 ano em segundos
const CACHE_TTL_USER_PLAN = 30 * 24 * 60 * 60; // 30 dias em segundos
const CACHE_TTL_PLANS_COMPARISON = 365 * 24 * 60 * 60; // 1 ano em segundos
const CACHE_TTL_UPGRADE_OPTIONS = 7 * 24 * 60 * 60; // 7 dias em segundos

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private plansRepository: Repository<Plan>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private readonly i18n: I18nService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async findAll(): Promise<Plan[]> {
        const cacheKey = 'plans:all';
        const cachedPlans = await this.cacheManager.get<Plan[]>(cacheKey);
        if (cachedPlans) {
            return cachedPlans;
        }

        const plans = await this.plansRepository.find({
            where: { isActive: true },
            order: { price: 'ASC' },
        });

        await this.cacheManager.set(cacheKey, plans, CACHE_TTL_PLANS_LIST);
        return plans;
    }
    async findOne(id: string, lang?: string): Promise<Plan> {
        const cacheKey = `plans:${id}`;
        const cachedPlan = await this.cacheManager.get<Plan>(cacheKey);

        if (cachedPlan) {
            return cachedPlan;
        }

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

        await this.cacheManager.set(cacheKey, plan, CACHE_TTL_PLAN_DETAIL);
        return plan;
    }

    async getUserPlan(userId: string, lang?: string): Promise<Plan> {
        const cacheKey = `user-plan:${userId}`;
        const cachedPlan = await this.cacheManager.get<Plan>(cacheKey);

        if (cachedPlan) {
            return cachedPlan;
        }

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

        const plan = await this.findOne(user.plan, lang);
        await this.cacheManager.set(cacheKey, plan, CACHE_TTL_USER_PLAN);
        return plan;
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
        const cacheKey = 'plans:compare';
        const cachedComparison = await this.cacheManager.get<any[]>(cacheKey);

        if (cachedComparison) {
            return cachedComparison;
        }

        const plans = await this.findAll();

        const comparison = plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            features: plan.features,
            recommended: plan.id === UserPlan.PRO,
        }));

        await this.cacheManager.set(cacheKey, comparison, CACHE_TTL_PLANS_COMPARISON);
        return comparison;
    }

    async getUpgradeOptions(userId: string, lang?: string): Promise<Plan[]> {
        const cacheKey = `user-upgrade-options:${userId}`;
        const cachedOptions = await this.cacheManager.get<Plan[]>(cacheKey);

        if (cachedOptions) {
            return cachedOptions;
        }

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
        const upgradeOptions = allPlans.filter(plan => {
            const planOrderValue = planOrder[plan.id];
            return planOrderValue > currentPlanOrder;
        });

        await this.cacheManager.set(cacheKey, upgradeOptions, CACHE_TTL_UPGRADE_OPTIONS);
        return upgradeOptions;
    }
}