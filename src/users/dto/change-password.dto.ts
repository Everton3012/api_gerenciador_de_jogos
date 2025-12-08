import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ 
    example: 'SenhaAntiga123!',
    description: 'Senha atual do usuário'
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ 
    example: 'NovaSenha456!',
    description: 'Nova senha (mínimo 6 caracteres)'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}