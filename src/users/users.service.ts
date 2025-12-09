import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm'; // Adicione IsNull aqui
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
  ) {}

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
      plan: createUserDto.plan as UserPlan,
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
        deletedAt: IsNull() // Adicione esta linha para filtrar usuários deletados
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
    await this.usersRepository.softDelete(id); // Use softDelete em vez de modificar manualmente
  }

  async hardDelete(id: string, lang?: string): Promise<void> {
    const user = await this.findOne(id, lang);
    await this.usersRepository.remove(user);
  }

  async upgradeToPremium(id: string, lang?: string): Promise<User> {
    const user = await this.findOne(id, lang);
    
    if (user.plan === UserPlan.PREMIUM) {
      throw new BadRequestException(
        await this.i18n.translate('users.ALREADY_PREMIUM', { lang }),
      );
    }
    
    user.plan = UserPlan.PREMIUM;
    return await this.usersRepository.save(user);
  }

  async downgradeToFree(id: string, lang?: string): Promise<User> {
    const user = await this.findOne(id, lang);
    
    if (user.plan === UserPlan.FREE) {
      throw new BadRequestException(
        await this.i18n.translate('users.ALREADY_FREE', { lang }),
      );
    }
    
    user.plan = UserPlan.FREE;
    return await this.usersRepository.save(user);
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
    // Buscar usuário COM a senha (addSelect para incluir campo com select: false)
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL')
      .addSelect('user.password') // Adiciona o campo password que tem select: false
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
}