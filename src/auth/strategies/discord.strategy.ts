// src/auth/strategies/discord.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-discord';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('DISCORD_CLIENT_ID');
    const clientSecret = configService.get<string>('DISCORD_CLIENT_SECRET');
    const callbackURL = configService.get<string>('DISCORD_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      console.warn('Discord OAuth credentials not configured. Discord login will not work.');
    }

    super({
      clientID: clientID || '',
      clientSecret: clientSecret || '',
      callbackURL: callbackURL || '',
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    try {
      const user = await this.authService.validateOAuthUser(profile, 'discord');
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}