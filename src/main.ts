import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',  // Frontend local
      'http://localhost:3001',  // Se estiver usando 3001
      'http://127.0.0.1:3000',  // IP local
      'http://127.0.0.1:3001',  // IP local alternativo
      process.env.FRONTEND_URL || 'http://localhost:3000', // Variável de ambiente
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Pipes globais para validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Interceptor para serialização (remover senha, etc)
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API Gerenciador de Jogos')
    .setDescription('API para gerenciar coleções de jogos com autenticação OAuth (Google, Facebook, Discord)')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticação (Local, Google, Facebook, Discord)')
    .addTag('users', 'Gerenciamento de usuários')
    .addTag('games', 'Gerenciamento de jogos')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Token JWT de autenticação',
      in: 'header',
    })
    .addServer('http://localhost:3000', 'Servidor Local')
    .addServer('https://api.seudominio.com', 'Servidor de Produção')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation: ${await app.getUrl()}/api`);
  console.log(`Google OAuth: ${await app.getUrl()}/auth/google`);
  console.log(`Discord OAuth: ${await app.getUrl()}/auth/discord`);
}
bootstrap();