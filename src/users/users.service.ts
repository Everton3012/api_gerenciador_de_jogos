import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProvider, UserPlan, UserRole } from './enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) { }

  async create(createUserDto: CreateUserDto, lang?: string): Promise<User> {
    // Verifica se o email já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        await this.i18n.translate('users.EMAIL_IN_USE', { lang }),
      );
    }

    // Hash da senha
    let hashedPassword: string | null = null;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      provider: createUserDto.provider as UserProvider,
      role: createUserDto.role as UserRole,
      plan: createUserDto.plan as UserPlan || UserPlan.FREE, // Default: FREE
    });

    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, lang?: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        deletedAt: IsNull()
      }
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('users.USER_NOT_FOUND', {
          lang,
          args: { id },
        }),
      );
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'provider', 'providerId', 'role', 'plan', 'isActive', 'emailVerified']
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, lang?: string): Promise<User> {
    const user = await this.findOne(id, lang);

    if (user.provider !== UserProvider.LOCAL) {
      if (updateUserDto['email']) {
        throw new BadRequestException(
          await this.i18n.translate('users.CANNOT_CHANGE_OAUTH_EMAIL', { lang }),
        );
      }
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: string, lang?: string): Promise<void> {
    const user = await this.findOne(id, lang);
    await this.usersRepository.softDelete(id);
  }

  async hardDelete(id: string, lang?: string): Promise<void> {
    const user = await this.findOne(id, lang);
    await this.usersRepository.remove(user);
  }

  // Atualizar plano para qualquer nível
  async changePlan(id: string, newPlan: UserPlan, lang?: string): Promise<User> {
    const user = await this.findOne(id, lang);

    if (user.plan === newPlan) {
      throw new BadRequestException(
        await this.i18n.translate('users.ALREADY_ON_PLAN', {
          lang,
          args: { plan: newPlan }
        }),
      );
    }

    user.plan = newPlan;
    return await this.usersRepository.save(user);
  }

  // Manter métodos legados para compatibilidade
  async upgradeToPremium(id: string, lang?: string): Promise<User> {
    return this.changePlan(id, UserPlan.PRO, lang);
  }

  async downgradeToFree(id: string, lang?: string): Promise<User> {
    return this.changePlan(id, UserPlan.FREE, lang);
  }

  // Novos métodos para planos específicos
  async upgradeToBasic(id: string, lang?: string): Promise<User> {
    return this.changePlan(id, UserPlan.BASIC, lang);
  }

  async upgradeToPro(id: string, lang?: string): Promise<User> {
    return this.changePlan(id, UserPlan.PRO, lang);
  }

  async upgradeToEnterprise(id: string, lang?: string): Promise<User> {
    const user = await this.findOne(id, lang);

    // Apenas admins podem definir plano Enterprise
    if (user.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        await this.i18n.translate('users.ENTERPRISE_REQUIRES_ADMIN', { lang }),
      );
    }

    return this.changePlan(id, UserPlan.ENTERPRISE, lang);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
    lang?: string,
  ): Promise<void> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL')
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('users.USER_NOT_FOUND', {
          lang,
          args: { id },
        }),
      );
    }

    if (!user.password) {
      throw new BadRequestException(
        await this.i18n.translate('users.OAUTH_CANNOT_CHANGE_PASSWORD', { lang }),
      );
    }

    const isValidPassword = await this.validatePassword(oldPassword, user.password);
    if (!isValidPassword) {
      throw new BadRequestException(
        await this.i18n.translate('users.WRONG_CURRENT_PASSWORD', { lang }),
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
  }

  // Verificar se usuário pode executar ação baseada no plano
  async canPerformAction(userId: string, action: string): Promise<boolean> {
    const user = await this.findOne(userId);

    // Mapeamento de permissões por plano
    const permissions = {
      [UserPlan.FREE]: ['basic'],
      [UserPlan.BASIC]: ['basic', 'knockout'],
      [UserPlan.PRO]: ['basic', 'knockout', 'advanced_stats', 'team_management'],
      [UserPlan.ENTERPRISE]: ['basic', 'knockout', 'advanced_stats', 'team_management', 'priority_support'],
    };

    return permissions[user.plan]?.includes(action) || false;
  }

  // Obter limites do plano do usuário
  async getUserLimits(userId: string): Promise<{
    maxMatchesPerMonth: number | null;
    maxTournamentsPerMonth: number | null;
  }> {
    const user = await this.findOne(userId);

    const limits = {
      [UserPlan.FREE]: { maxMatchesPerMonth: 10, maxTournamentsPerMonth: 1 },
      [UserPlan.BASIC]: { maxMatchesPerMonth: 50, maxTournamentsPerMonth: 5 },
      [UserPlan.PRO]: { maxMatchesPerMonth: null, maxTournamentsPerMonth: null },
      [UserPlan.ENTERPRISE]: { maxMatchesPerMonth: null, maxTournamentsPerMonth: null },
    };

    return limits[user.plan];
  }
}