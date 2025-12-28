import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PlansModule } from './plans/plans.module';
import { I18nConfigModule } from './i18n/I18n.module';
import { MatchesModule } from './matches/matches.module';
import { CacheModule } from '@nestjs/cache-manager';
const timeTll = 5 * 60 * 1000; // 5 minutos em milissegundos
const maxCache = 100; // Máximo 100 itens
const isGlobal = true; // Cache global
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), I18nConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    PlansModule,
    CacheModule.register({
      isGlobal: isGlobal,
      ttl: timeTll,
      max: maxCache,
    }),
    MatchesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
