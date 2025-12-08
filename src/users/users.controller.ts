import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseInterceptors, 
    ClassSerializerInterceptor,
    UseGuards,
    HttpCode,
    HttpStatus
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
  import { I18nLang, I18nService } from 'nestjs-i18n';
  import { UsersService } from './users.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { ChangePasswordDto } from './dto/change-password.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { User } from './entities/user.entity';
  
  @ApiTags('Usuários')
  @Controller('users')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Idioma da resposta (pt-BR, en, es)',
    required: false,
    example: 'pt-BR',
  })
  export class UsersController {
    constructor(
      private readonly usersService: UsersService,
      private readonly i18n: I18nService, // ✅ Injetado aqui
    ) {}
  
    @Post()
    @ApiOperation({ summary: 'Criar um novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
    @ApiResponse({ status: 409, description: 'Email já existe' })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    create(
      @Body() createUserDto: CreateUserDto,
      @I18nLang() lang: string,
    ) {
      return this.usersService.create(createUserDto, lang);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Listar todos os usuários' })
    @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    findAll() {
      return this.usersService.findAll();
    }
  
    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    getProfile(@CurrentUser() user: User) {
      return user;
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Buscar usuário por ID' })
    @ApiResponse({ status: 200, description: 'Usuário encontrado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    findOne(
      @Param('id') id: string,
      @I18nLang() lang: string,
    ) {
      return this.usersService.findOne(id, lang);
    }
  
    @Patch('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    updateProfile(
      @CurrentUser() user: User,
      @Body() updateUserDto: UpdateUserDto,
      @I18nLang() lang: string,
    ) {
      return this.usersService.update(user.id, updateUserDto, lang);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualizar usuário por ID (Admin)' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    update(
      @Param('id') id: string,
      @Body() updateUserDto: UpdateUserDto,
      @I18nLang() lang: string,
    ) {
      return this.usersService.update(id, updateUserDto, lang);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Deletar usuário (soft delete)' })
    @ApiResponse({ status: 204, description: 'Usuário deletado com sucesso' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    remove(
      @Param('id') id: string,
      @I18nLang() lang: string,
    ) {
      return this.usersService.remove(id, lang);
    }
  
    @Post('me/change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
    @ApiResponse({ status: 400, description: 'Senha atual incorreta' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    async changePassword(
      @CurrentUser() user: User,
      @Body() changePasswordDto: ChangePasswordDto,
      @I18nLang() lang: string,
    ) {
      await this.usersService.changePassword(
        user.id,
        changePasswordDto.oldPassword,
        changePasswordDto.newPassword,
        lang,
      );
      return { 
        message: await this.i18n.translate('users.PASSWORD_CHANGED', { lang }) // ✅ Corrigido
      };
    }
  
    @Post(':id/upgrade')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Fazer upgrade para premium (Admin)' })
    @ApiResponse({ status: 200, description: 'Upgrade realizado com sucesso' })
    @ApiResponse({ status: 400, description: 'Usuário já é premium' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    upgradeToPremium(
      @Param('id') id: string,
      @I18nLang() lang: string,
    ) {
      return this.usersService.upgradeToPremium(id, lang);
    }
  
    @Post(':id/downgrade')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Fazer downgrade para free (Admin)' })
    @ApiResponse({ status: 200, description: 'Downgrade realizado com sucesso' })
    @ApiResponse({ status: 400, description: 'Usuário já é free' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    downgradeToFree(
      @Param('id') id: string,
      @I18nLang() lang: string,
    ) {
      return this.usersService.downgradeToFree(id, lang);
    }
  }