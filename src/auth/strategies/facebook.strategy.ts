// src/auth/strategies/facebook.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('FACEBOOK_CLIENT_ID');
    const clientSecret = configService.get<string>('FACEBOOK_CLIENT_SECRET');
    const callbackURL = configService.get<string>('FACEBOOK_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      console.warn('Facebook OAuth credentials not configured. Facebook login will not work.');
    }

    super({
      clientID: clientID || '',
      clientSecret: clientSecret || '',
      callbackURL: callbackURL || '',
      scope: ['email'],
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    try {
      const user = await this.authService.validateOAuthUser(profile, 'facebook');
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}