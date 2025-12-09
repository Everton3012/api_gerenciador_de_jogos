import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserProvider, UserRole, UserPlan } from '../enums';

@Entity('users')
@Index(['email'])
@Index(['provider', 'providerId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  @Exclude()
  password: string | null;

  @Column({ 
    type: 'enum', 
    enum: UserProvider, 
    default: UserProvider.LOCAL 
  })
  provider: UserProvider;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  providerId: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  avatarUrl: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.USER 
  })
  role: UserRole;

  @Column({ 
    type: 'enum', 
    enum: UserPlan, 
    default: UserPlan.FREE 
  })
  @Index()
  plan: UserPlan;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt?: Date;
}