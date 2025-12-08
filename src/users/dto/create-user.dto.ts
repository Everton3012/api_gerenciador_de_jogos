import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'SenhaSegura123!' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'local', enum: ['local', 'google', 'facebook'] })
  @IsEnum(['local', 'google', 'facebook'])
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  providerId?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: 'user', enum: ['user', 'admin'] })
  @IsEnum(['user', 'admin'])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 'free', enum: ['free', 'premium'] })
  @IsEnum(['free', 'premium'])
  @IsOptional()
  plan?: string;
}