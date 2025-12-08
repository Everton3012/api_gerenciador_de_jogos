# 🎮 API Gerenciador de Jogos

API REST completa para gerenciamento de campeonatos multi-modalidades, desenvolvida com NestJS, PostgreSQL, TypeORM e autenticação JWT + OAuth2.

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=white" alt="Swagger" />
</p>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Migrações](#-migrações)
- [Testes](#-testes)
- [Documentação da API](#-documentação-da-api)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

API completa para gerenciamento de campeonatos de jogos, com suporte a múltiplas modalidades, autenticação robusta, planos free/premium e integração com Mercado Pago para pagamentos.

### Principais Características:

- ✅ Autenticação JWT + OAuth2 (Google, Facebook)
- ✅ Multi-idioma (Português, Inglês, Espanhol)
- ✅ Planos Free e Premium
- ✅ Soft delete para dados sensíveis
- ✅ Documentação automática com Swagger
- ✅ Testes unitários e E2E
- ✅ Migrações de banco de dados com TypeORM
- ✅ Validação de dados com class-validator
- ✅ Fastify para máxima performance

---

## 🚀 Funcionalidades

### 👤 Módulo de Usuários
- ✅ Registro e login tradicional
- ✅ Login social (Google, Facebook)
- ✅ Perfil do usuário com avatar
- ✅ Troca de senha
- ✅ Upgrade/Downgrade de plano
- ✅ Soft delete
- ✅ Multi-idioma

### 🔐 Módulo de Autenticação
- ✅ JWT com refresh tokens
- ✅ OAuth2 (Google, Facebook)
- ✅ Proteção de rotas com guards
- ✅ Roles (user, admin)
- ✅ Estratégias Passport

### 🎮 Módulo de Jogos (em desenvolvimento)
- CRUD de jogos
- Filtros e busca
- Categorias e gêneros

### 🏆 Módulo de Campeonatos (em desenvolvimento)
- Criação de campeonatos
- Inscrições de times
- Gerenciamento de partidas
- Classificação automática
- Sistema de pontuação

### 💳 Módulo de Pagamentos (em desenvolvimento)
- Integração com Mercado Pago
- Webhooks para confirmação
- Gerenciamento de assinaturas
- Histórico de pagamentos

---

## 🛠️ Tecnologias

### Backend
- [NestJS](https://nestjs.com/) ^10.0.0 - Framework Node.js progressivo
- [TypeScript](https://www.typescriptlang.org/) ^5.1.3 - Superset JavaScript tipado
- [Fastify](https://www.fastify.io/) ^4.28.1 - HTTP Server de alta performance
- [TypeORM](https://typeorm.io/) ^0.3.20 - ORM para TypeScript
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados relacional
- [Passport](http://www.passportjs.org/) ^0.7.0 - Autenticação middleware
- [JWT](https://jwt.io/) - Tokens de autenticação

### Validação e Transformação
- [class-validator](https://github.com/typestack/class-validator) ^0.14.0
- [class-transformer](https://github.com/typestack/class-transformer) ^0.5.1

### Internacionalização
- [nestjs-i18n](https://nestjs-i18n.com/) ^10.4.5

### Documentação
- [Swagger](https://swagger.io/) via @nestjs/swagger ^7.1.17

### Testes
- [Jest](https://jestjs.io/) ^29.5.0 - Framework de testes
- [Supertest](https://github.com/visionmedia/supertest) ^6.3.3 - Testes HTTP

### Ferramentas de Desenvolvimento
- [ESLint](https://eslint.org/) ^8.42.0 - Linter
- [Prettier](https://prettier.io/) ^3.0.0 - Formatação de código
- [ts-node](https://typestrong.org/ts-node/) - Execução TypeScript

---

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18.x
- [npm](https://www.npmjs.com/) >= 9.x
- [PostgreSQL](https://www.postgresql.org/) >= 14.x
- [Git](https://git-scm.com/)

---

## 🔧 Instalação

### 1. Clone o repositório (repositório privado):
```bash
git clone https://github.com/seu-usuario/api-gerenciador-de-jogos.git
cd api-gerenciador-de-jogos
```

### 2. Instale as dependências:
```bash
npm install
```

### 3. Variáveis de Ambiente:

O arquivo `.env` já está incluído no repositório (privado) com configurações de desenvolvimento.

**Para produção**, configure as variáveis no Railway ou crie `.env.production`:
```bash
cp .env .env.production
# Edite .env.production com valores de produção
```

⚠️ **Importante:** Nunca commite `.env.production` no Git!

### 4. Execute as migrações:
```bash
npm run build
npm run migration:run
```

---

## ⚙️ Configuração

### Banco de Dados

O projeto usa PostgreSQL. Configure a URL de conexão no `.env`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/api_jogos
```

### OAuth2 (Opcional)

Para ativar login social, configure as credenciais:

#### Google OAuth:
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto
3. Ative a API Google+ 
4. Crie credenciais OAuth 2.0
5. Configure URIs de redirecionamento:
   - `http://localhost:3000/auth/google/callback`
6. Adicione as credenciais no `.env`

#### Facebook OAuth:
1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um app
3. Configure Facebook Login
4. Adicione URIs válidas de redirecionamento:
   - `http://localhost:3000/auth/facebook/callback`
5. Adicione as credenciais no `.env`

---

## 🚀 Executando o Projeto

### Desenvolvimento (com hot-reload):
```bash
npm run start:dev
```

### Produção:
```bash
npm run build
npm run start:prod
```

### Debug:
```bash
npm run start:debug
```

A aplicação estará disponível em:
- **API**: http://localhost:3000
- **Swagger (Documentação)**: http://localhost:3000/api
- **Health Check**: http://localhost:3000

---

## 🗄️ Migrações

Este projeto usa **migrações TypeORM** para controle de versão do banco de dados.

### Gerar nova migração (após alterar entidades):
```bash
npm run build
npm run migration:generate -- ./src/migrations/NomeDaMigracao
```

### Criar migração vazia:
```bash
npm run migration:create -- ./src/migrations/NomeDaMigracao
```

### Executar migrações pendentes:
```bash
npm run migration:run
```

### Reverter última migração:
```bash
npm run migration:revert
```

### Ver status das migrações:
```bash
npm run migration:show
```

### Dropar schema completo (⚠️ cuidado!):
```bash
npm run schema:drop
```

---

## 🧪 Testes

### Testes unitários:
```bash
npm run test
```

### Testes E2E:
```bash
npm run test:e2e
```

### Cobertura de código:
```bash
npm run test:cov
```

### Modo watch (desenvolvimento):
```bash
npm run test:watch
```

### Debug de testes:
```bash
npm run test:debug
```

**Cobertura atual:**
- Users Service: 95%+
- Users E2E: 37 testes passando

---

## 📚 Documentação da API

A documentação completa da API está disponível via **Swagger UI**:

```
http://localhost:3000/api
```

### Principais Endpoints:

#### 🔐 Autenticação:
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register` | Registrar novo usuário | ❌ |
| POST | `/auth/login` | Login com email/senha | ❌ |
| GET | `/auth/google` | Login com Google | ❌ |
| GET | `/auth/facebook` | Login com Facebook | ❌ |
| POST | `/auth/refresh` | Renovar access token | ❌ |
| GET | `/auth/me` | Perfil do usuário autenticado | ✅ |

#### 👤 Usuários:
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/users` | Listar usuários ativos | ✅ |
| GET | `/users/me` | Perfil do usuário logado | ✅ |
| GET | `/users/:id` | Buscar usuário por ID | ✅ |
| PATCH | `/users/me` | Atualizar perfil | ✅ |
| PATCH | `/users/:id` | Atualizar usuário (admin) | ✅ |
| DELETE | `/users/:id` | Deletar usuário (soft) | ✅ |
| POST | `/users/me/change-password` | Trocar senha | ✅ |
| POST | `/users/:id/upgrade` | Upgrade para premium | ✅ |
| POST | `/users/:id/downgrade` | Downgrade para free | ✅ |

---

## 📁 Estrutura do Projeto

```
src/
├── auth/                    # Módulo de autenticação
│   ├── decorators/         # Decorators customizados (@CurrentUser)
│   ├── dto/                # DTOs (register, login, auth-response)
│   ├── guards/             # Guards (jwt-auth, google-auth, facebook-auth)
│   ├── strategies/         # Estratégias Passport (JWT, Google, Facebook)
│   ├── auth.controller.ts  # Rotas de autenticação
│   ├── auth.service.ts     # Lógica de autenticação
│   └── auth.module.ts      # Módulo de autenticação
├── users/                   # Módulo de usuários
│   ├── dto/                # DTOs (create, update, change-password)
│   ├── entities/           # Entidade User (TypeORM)
│   ├── enums/              # Enums (provider, role, plan)
│   ├── users.controller.ts # Rotas de usuários
│   ├── users.service.ts    # Lógica de negócio de usuários
│   └── users.module.ts     # Módulo de usuários
├── common/                  # Recursos compartilhados
│   └── decorators/         # Decorators globais
├── config/                  # Configurações
│   └── typeorm.config.ts   # Configuração TypeORM para migrações
├── database/                # Módulo de banco de dados
│   └── database.module.ts  # Configuração TypeORM
├── i18n/                    # Internacionalização
│   ├── pt-BR/              # Traduções português
│   │   ├── auth.json
│   │   ├── users.json
│   │   └── common.json
│   ├── en/                 # Traduções inglês
│   └── es/                 # Traduções espanhol
├── migrations/              # Migrações do banco de dados
│   └── 1765225200000-CreateUsersTable.ts
├── app.module.ts           # Módulo raiz
└── main.ts                 # Bootstrap da aplicação
```

---

## 🔐 Variáveis de Ambiente

### Desenvolvimento (`.env` - versionado):

```env
# Database
DATABASE_URL=postgresql://postgres:senha@localhost:5432/api_jogos_dev

# JWT
JWT_SECRET=dev-secret-key-not-for-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-dev-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-dev-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# App
PORT=3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
NODE_ENV=development
```

### Produção (`.env.production` - **NÃO versionado**):

Configure no Railway ou crie `.env.production` com valores reais de produção.

---

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run build` | Compila o projeto TypeScript para JavaScript |
| `npm run start` | Inicia a aplicação (modo produção) |
| `npm run start:dev` | Inicia com hot-reload (desenvolvimento) |
| `npm run start:debug` | Inicia em modo debug |
| `npm run start:prod` | Inicia aplicação compilada (produção) |
| `npm run lint` | Executa o ESLint |
| `npm run format` | Formata código com Prettier |
| `npm run test` | Executa testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:cov` | Testes com cobertura de código |
| `npm run test:debug` | Testes em modo debug |
| `npm run test:e2e` | Executa testes end-to-end |
| `npm run typeorm` | CLI do TypeORM |
| `npm run migration:generate` | Gera nova migração |
| `npm run migration:create` | Cria migração vazia |
| `npm run migration:run` | Executa migrações pendentes |
| `npm run migration:revert` | Reverte última migração |
| `npm run migration:show` | Mostra status das migrações |
| `npm run schema:drop` | Dropa o schema do banco (⚠️) |
| `npm run schema:sync` | Sincroniza schema (⚠️ dev only) |

---

## 🌍 Multi-idioma

A API suporta múltiplos idiomas via header `Accept-Language`:

```bash
# Português (padrão)
curl -H "Accept-Language: pt-BR" http://localhost:3000/users/invalid-id
# Response: "Usuário com ID invalid-id não encontrado"

# Inglês
curl -H "Accept-Language: en" http://localhost:3000/users/invalid-id
# Response: "User with ID invalid-id not found"

# Espanhol
curl -H "Accept-Language: es" http://localhost:3000/users/invalid-id
# Response: "Usuario con ID invalid-id no encontrado"
```

**Idiomas disponíveis:**
- 🇧🇷 Português (pt-BR) - padrão
- 🇺🇸 Inglês (en)
- 🇪🇸 Espanhol (es)

---

## 🧪 Exemplos de Uso

### 1. Registrar novo usuário:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "SenhaSegura123!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "provider": "local",
    "plan": "free",
    "role": "user"
  }
}
```

### 2. Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "SenhaSegura123!"
  }'
```

### 3. Buscar perfil (autenticado):
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer seu-token-jwt-aqui"
```

### 4. Atualizar perfil:
```bash
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Atualizado"
  }'
```

### 5. Trocar senha:
```bash
curl -X POST http://localhost:3000/users/me/change-password \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "SenhaSegura123!",
    "newPassword": "NovaSenha456!"
  }'
```

---

## 📊 Status do Projeto

| Módulo | Status | Progresso |
|--------|--------|-----------|
| ✅ **Database** | Completo | 100% |
| ✅ **Migrações** | Completo | 100% |
| ✅ **Users** | Completo | 100% |
| ✅ **Auth** | Completo | 100% |
| ✅ **I18n** | Completo | 100% |
| ✅ **Testes** | Em andamento | 85% |
| 🔄 **Games** | Em desenvolvimento | 0% |
| 🔄 **Championships** | Planejado | 0% |
| 🔄 **Payments** | Planejado | 0% |

---

## 📄 Licença

Este projeto é privado e de uso interno.

---

## 🔗 Links Úteis

- [Documentação NestJS](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)
- [Swagger](https://swagger.io/)
- [Fastify](https://www.fastify.io/)

---

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no repositório
- Contate a equipe de desenvolvimento

---

<p align="center">
  Desenvolvido com ❤️ usando NestJS
</p>