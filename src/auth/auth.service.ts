import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { UserProvider } from '../users/enums';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async register(registerDto: RegisterDto, lang?: string) {
    // Verifica se email já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException(
        await this.i18n.translate('auth.EMAIL_ALREADY_EXISTS', { lang }),
      );
    }

    // Cria usuário
    const user = await this.usersService.create(registerDto, lang);

    // Gera tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

// src/auth/auth.service.ts
async login(loginDto: LoginDto, lang?: string) {
  console.log('🔍 DEBUG - Tentativa de login:', loginDto.email);
  console.log('🔍 DEBUG - Dados recebidos:', { email: loginDto.email, hasPassword: !!loginDto.password });

  try {
      // Valida usuário
      const user = await this.validateUser(loginDto.email, loginDto.password);
      console.log('🔍 DEBUG - Usuário encontrado:', user ? 'SIM' : 'NÃO');

      if (!user) {
          console.log('❌ ERRO: Credenciais inválidas');
          throw new UnauthorizedException(
              await this.i18n.translate('auth.INVALID_CREDENTIALS', { lang }),
          );
      }

      console.log('✅ Usuário válido, gerando tokens...');

      // Gera tokens
      const tokens = await this.generateTokens(user);

      return {
          ...tokens,
          user: this.sanitizeUser(user),
      };
  } catch (error) {
      console.log('❌ ERRO no login:', error.message);
      throw error;
  }
}

async validateUser(email: string, password: string): Promise<User | null> {
  console.log('🔍 DEBUG - Procurando usuário por email:', email);

  try {
      const user = await this.usersService.findByEmail(email);
      console.log('🔍 DEBUG - Usuário do banco:', user ? { id: user.id, email: user.email, hasPassword: !!user.password } : null);

      if (!user || !user.password) {
          console.log('❌ ERRO: Usuário não encontrado ou sem senha');
          return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('🔍 DEBUG - Senha válida:', isPasswordValid);

      if (!isPasswordValid) {
          console.log('❌ ERRO: Senha incorreta');
          return null;
      }

      return user;
  } catch (error) {
      console.log('❌ ERRO na validação:', error.message);
      return null;
  }
}

  async validateOAuthUser(profile: any, provider: 'google' | 'facebook' | 'discord', lang?: string): Promise<User> {
    const email = profile.emails?.[0]?.value || profile.email;
    
    if (!email) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.EMAIL_NOT_PROVIDED', { lang }),
      );
    }

    // Busca usuário existente
    let user = await this.usersService.findByEmail(email);

    if (user) {
      // Atualiza dados do provedor se necessário
      if (!user.provider || user.provider === UserProvider.LOCAL) {
        // Mapeia string para enum
        const userProvider = this.mapProviderToEnum(provider);
        
        // Atualiza apenas campos permitidos
        await this.usersService.update(user.id, {
          avatarUrl: profile.photos?.[0]?.value || profile.picture || profile.avatarUrl || null,
        }, lang);
        
        // Atualiza provider e providerId manualmente
        user.provider = userProvider;
        user.providerId = profile.id || profile.providerId;
        user.emailVerified = true;
      }
    } else {
      // Cria novo usuário com enum correto
      const userProvider = this.mapProviderToEnum(provider);
      
      user = await this.usersService.create({
        name: profile.displayName || profile.name || profile.username || 'Usuário',
        email,
        provider: userProvider,
        providerId: profile.id || profile.providerId,
        avatarUrl: profile.photos?.[0]?.value || profile.picture || profile.avatarUrl || null,
        emailVerified: true,
      }, lang);
    }

    return user;
  }

  // Novo método para login OAuth genérico (Google, Facebook, Discord)
  async validateOAuthLogin(profile: any, lang?: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
    const provider = profile.provider as 'google' | 'facebook' | 'discord';
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Criar novo usuário se não existir
      const userProvider = this.mapProviderToEnum(provider);
      
      user = await this.usersService.create({
        name: profile.username || profile.displayName || profile.name || 'Usuário',
        email: profile.email,
        provider: userProvider,
        providerId: profile.providerId,
        avatarUrl: profile.avatarUrl,
        emailVerified: true,
        password: undefined, // OAuth users não têm senha
      }, lang);
    } else if (user.provider !== this.mapProviderToEnum(provider) || user.providerId !== profile.providerId) {
      // Atualizar informações do OAuth se necessário
      await this.usersService.update(user.id, {
        avatarUrl: profile.avatarUrl,
      }, lang);
      
      user.provider = this.mapProviderToEnum(provider);
      user.providerId = profile.providerId;
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(refreshToken: string, lang?: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub, lang);
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.INVALID_TOKEN', { lang }),
      );
    }
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  // Helper method para mapear string para enum
  private mapProviderToEnum(provider: 'google' | 'facebook' | 'discord'): UserProvider {
    const providerMap = {
      google: UserProvider.GOOGLE,
      facebook: UserProvider.FACEBOOK,
      discord: UserProvider.DISCORD,
    };
    
    return providerMap[provider] || UserProvider.LOCAL;
  }
}