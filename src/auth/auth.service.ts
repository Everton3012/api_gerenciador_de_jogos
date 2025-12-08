import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
  ) {}

  async register(registerDto: RegisterDto) {
    // Verifica se email já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Cria usuário
    const user = await this.usersService.create(registerDto);

    // Gera tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    // Valida usuário
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gera tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async validateOAuthUser(profile: any, provider: 'google' | 'facebook'): Promise<User> {
    const email = profile.emails?.[0]?.value || profile.email;
    
    if (!email) {
      throw new UnauthorizedException('Email não fornecido pelo provedor');
    }

    // Busca usuário existente
    let user = await this.usersService.findByEmail(email);

    if (user) {
      // Atualiza dados do provedor se necessário
      if (!user.provider || user.provider === UserProvider.LOCAL) {
        // ✅ Correção: Mapeia string para enum
        const userProvider = provider === 'google' ? UserProvider.GOOGLE : UserProvider.FACEBOOK;
        
        // ✅ Correção: Passa apenas os campos do UpdateUserDto
        await this.usersService.update(user.id, {
          avatarUrl: profile.photos?.[0]?.value || profile.picture || null,
        });
        
        // Atualiza provider e providerId manualmente (campos não estão no UpdateUserDto)
        user.provider = userProvider;
        user.providerId = profile.id;
        user.emailVerified = true;
      }
    } else {
      // ✅ Correção: Cria novo usuário com enum correto
      const userProvider = provider === 'google' ? UserProvider.GOOGLE : UserProvider.FACEBOOK;
      
      user = await this.usersService.create({
        name: profile.displayName || profile.name || 'Usuário',
        email,
        provider: userProvider,
        providerId: profile.id,
        avatarUrl: profile.photos?.[0]?.value || profile.picture || null,
        emailVerified: true,
      });
    }

    return user;
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

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}