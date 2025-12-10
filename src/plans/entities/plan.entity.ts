// src/plans/entities/plan.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('plans')
export class Plan {
    @PrimaryColumn({ type: 'varchar', length: 20 })
    id: string; // 'free' | 'basic' | 'pro' | 'enterprise'

    @Column({ type: 'varchar', length: 50 })
    name: string;

    @Column({ type: 'int', default: 0, comment: 'Preço em centavos' })
    price: number;

    @Column({ type: 'varchar', length: 3, default: 'BRL' })
    currency: string;

    @Column({ type: 'jsonb' })
    features: {
        maxMatchesPerMonth: number | null;
        maxTournamentsPerMonth: number | null;
        advancedStats: boolean;
        knockoutMode: boolean;
        teamManagement: boolean;
        prioritySupport: boolean;
    };

    @Column({ type: 'boolean', default: false })
    isEnterprise: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}