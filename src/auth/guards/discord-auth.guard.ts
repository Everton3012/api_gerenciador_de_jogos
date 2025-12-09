// src/auth/guards/discord-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DiscordAuthGuard extends AuthGuard('discord') {}