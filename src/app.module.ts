import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PlansModule } from './plans/plans.module';
import { I18nConfigModule } from './i18n/I18n.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), I18nConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
