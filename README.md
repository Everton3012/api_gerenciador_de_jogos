🎮 API Gerenciador de Jogos (Portfolio)

API REST modular para gerenciamento de jogos e campeonatos, desenvolvida com NestJS, PostgreSQL, TypeORM e autenticação JWT, com foco em arquitetura backend, boas práticas, organização de código e documentação.

<p align="center"> <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" /> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /> <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" /> <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=white" alt="Swagger" /> </p>
📋 Índice

Sobre o Projeto

Objetivo do Projeto

Funcionalidades

Funcionalidades Avançadas

Tecnologias

Pré-requisitos

Instalação

Configuração

Executando o Projeto

Migrações

Testes

Documentação da API

Estrutura do Projeto

Variáveis de Ambiente

Scripts Disponíveis

Status do Projeto

Licença

🎯 Sobre o Projeto

API REST para gerenciamento de jogos e campeonatos, estruturada de forma modular e escalável.

O projeto foi desenvolvido como um MVP de portfólio, priorizando clareza arquitetural, boas práticas e organização de código, servindo como base para estudos, evolução futura e migração de stack.

🧭 Objetivo do Projeto

Demonstrar competências em desenvolvimento backend, incluindo:

Arquitetura modular com NestJS

Autenticação e autorização com JWT

Modelagem de entidades com TypeORM

Validação de dados

Migrações de banco de dados

Documentação automática com Swagger

Organização para crescimento futuro

🚀 Funcionalidades
👤 Módulo de Usuários

Registro e login tradicional

Perfil do usuário autenticado

Atualização de dados do perfil

Soft delete

🔐 Módulo de Autenticação

Autenticação JWT

Proteção de rotas com Guards

Controle de permissões por roles (user, admin)

Estratégias com Passport

🎮 Módulo de Jogos

CRUD de jogos

Filtros e busca

Associação com usuários

🏆 Módulo de Campeonatos (MVP)

Criação de campeonatos

Associação com jogos

Controle de status (draft, active, finished)

🔌 Funcionalidades Avançadas

O projeto conta com funcionalidades adicionais já implementadas, porém desativadas por padrão, mantendo o foco no escopo principal do portfólio:

OAuth2 (Google e Facebook)

Sistema de planos (Free / Premium)

Integração com pagamentos

Internacionalização (i18n)

Testes E2E adicionais

Esses módulos demonstram capacidade de evolução do sistema sem impactar o core funcional.

🛠️ Tecnologias
Backend

NestJS

TypeScript

Express

TypeORM

PostgreSQL

Passport

JWT

Validação e Qualidade

class-validator

class-transformer

ESLint

Prettier

Documentação

Swagger

Testes

Jest

Supertest

📦 Pré-requisitos

Node.js >= 18.x

npm >= 9.x

PostgreSQL >= 14.x

Git

🔧 Instalação
git clone https://github.com/seu-usuario/api-gerenciador-de-jogos.git
cd api-gerenciador-de-jogos
npm install

⚙️ Configuração

O projeto utiliza variáveis de ambiente para configuração.

O arquivo .env incluído no repositório contém configurações de desenvolvimento.

Para produção, utilize .env.production.

🚀 Executando o Projeto
Desenvolvimento
npm run start:dev


A aplicação estará disponível em:

API: http://localhost:3000

Swagger: http://localhost:3000/api

🗄️ Migrações

O projeto utiliza migrações do TypeORM para controle de versão do banco de dados.

npm run migration:run

🧪 Testes
npm run test
npm run test:e2e
npm run test:cov

📚 Documentação da API

A documentação completa da API está disponível via Swagger:

http://localhost:3000/api

📁 Estrutura do Projeto
src/
├── auth/
├── users/
├── games/
├── championships/
├── database/
├── common/
├── app.module.ts
└── main.ts

🔐 Variáveis de Ambiente (Exemplo)
DATABASE_URL=postgresql://postgres:senha@localhost:5432/api_jogos_dev

JWT_SECRET=dev-secret
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

📜 Scripts Disponíveis
Script	Descrição
npm run start:dev	Desenvolvimento
npm run build	Build do projeto
npm run start:prod	Produção
npm run test	Testes
npm run lint	ESLint
npm run format	Prettier
📊 Status do Projeto
Módulo	Status
Database	✅ Completo
Migrações	✅ Completo
Auth	✅ Completo
Users	✅ Completo
Games	🟡 MVP
Championships	🟡 MVP
Funcionalidades Avançadas	🔒 Desativadas
📄 Licença

Projeto privado, desenvolvido para fins educacionais e de portfólio.

<p align="center"> Desenvolvido com ❤️ usando NestJS </p>
