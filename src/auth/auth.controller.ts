// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { DiscordAuthGuard } from './guards/discord-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: AuthResponseDto
  })
  @ApiResponse({ status: 409, description: 'Email já existe' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() loginDto: LoginDto) {
    console.log('🔍 CONTROLLER - Login DTO recebido:', loginDto);
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Iniciar login com Google' })
  @ApiResponse({ status: 302, description: 'Redireciona para Google OAuth' })
  async googleAuth(): Promise<void> {
    // Guard redireciona para Google automaticamente
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  @ApiResponse({ status: 302, description: 'Redireciona para frontend com tokens' })
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const tokens = await this.authService.validateOAuthLogin(req.user);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      res.redirect(
        `${frontendUrl}/auth/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`
      );
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Iniciar login com Facebook' })
  @ApiResponse({ status: 302, description: 'Redireciona para Facebook OAuth' })
  async facebookAuth(): Promise<void> {
    // Guard redireciona para Facebook automaticamente
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Callback do Facebook OAuth' })
  @ApiResponse({ status: 302, description: 'Redireciona para frontend com tokens' })
  async facebookAuthCallback(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const tokens = await this.authService.validateOAuthLogin(req.user);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      res.redirect(
        `${frontendUrl}/auth/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`
      );
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('discord')
  @UseGuards(DiscordAuthGuard)
  @ApiOperation({ summary: 'Iniciar login com Discord' })
  @ApiResponse({ status: 302, description: 'Redireciona para Discord OAuth' })
  async discordAuth(): Promise<void> {
    // Guard redireciona para Discord automaticamente
  }

  @Get('discord/callback')
  @UseGuards(DiscordAuthGuard)
  @ApiOperation({ summary: 'Callback do Discord OAuth' })
  @ApiResponse({ status: 302, description: 'Redireciona para frontend com tokens' })
  async discordAuthCallback(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const tokens = await this.authService.validateOAuthLogin(req.user);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      res.redirect(
        `${frontendUrl}/auth/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`
      );
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getProfile(@CurrentUser() user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }
}