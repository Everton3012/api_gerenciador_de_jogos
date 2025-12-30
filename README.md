# 🎮 API Gerenciador de Jogos (Portfolio)

API REST modular para gerenciamento de jogos e campeonatos, desenvolvida com **NestJS**, **PostgreSQL**, **TypeORM** e **autenticação JWT**, com foco em **arquitetura backend**, **boas práticas**, **organização de código** e **documentação**.

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=white" />
</p>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Objetivo do Projeto](#-objetivo-do-projeto)
- [Funcionalidades](#-funcionalidades)
- [Funcionalidades Avançadas](#-funcionalidades-avançadas)
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
- [Status do Projeto](#-status-do-projeto)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

API REST para gerenciamento de jogos e campeonatos, estruturada de forma modular e escalável.

O projeto foi desenvolvido como um **MVP de portfólio**, priorizando clareza arquitetural, boas práticas e organização de código.

---

## 🧭 Objetivo do Projeto

Demonstrar competências em desenvolvimento backend, incluindo:

- Arquitetura modular com NestJS  
- Autenticação e autorização com JWT  
- Modelagem de entidades com TypeORM  
- Validação de dados  
- Migrações de banco de dados  
- Documentação automática com Swagger  

---

## 🚀 Funcionalidades

### 👤 Usuários
- Registro e login
- Perfil do usuário autenticado
- Atualização de dados
- Soft delete

### 🔐 Autenticação
- JWT
- Guards de proteção
- Controle de roles (`user`, `admin`)

### 🎮 Jogos
- CRUD de jogos
- Filtros e busca
- Associação com usuários

### 🏆 Campeonatos (MVP)
- Criação de campeonatos
- Associação com jogos
- Controle de status

---

## 🔌 Funcionalidades Avançadas

Funcionalidades já implementadas, porém **desativadas por padrão**:

- OAuth2 (Google / Facebook)
- Sistema de planos
- Integração com pagamentos
- Internacionalização (i18n)
- Testes E2E adicionais

Esses módulos demonstram a capacidade de evolução do sistema.

---

## 🛠️ Tecnologias

### Backend
- NestJS
- TypeScript
- Express
- TypeORM
- PostgreSQL
- JWT
- Passport

### Qualidade
- ESLint
- Prettier
- class-validator

### Documentação
- Swagger

---

## 📦 Pré-requisitos

- Node.js >= 18
- PostgreSQL >= 14
- Git

---

## 🔧 Instalação

```bash
git clone https://github.com/seu-usuario/api-gerenciador-de-jogos.git
cd api-gerenciador-de-jogos
npm install
```

## ⚙️ Configuração
O projeto utiliza variáveis de ambiente.
```bash
Exemplo:

env

DATABASE_URL=postgresql://postgres:senha@localhost:5432/api_jogos_dev
JWT_SECRET=dev-secret
JWT_EXPIRES_IN=7d
PORT=3000
```

## 🚀 Executando
```bash

npm run start:dev
```
API: http://localhost:3000

Swagger: http://localhost:3000/api

## 🗄️ Migrações
```bash

npm run migration:run
```

## 🧪 Testes
```bash
npm run test
npm run test:e2e
npm run test:cov
```
## 📁 Estrutura do Projeto
text
```bash
src/
├── auth/
├── users/
├── games/
├── championships/
├── database/
├── common/
├── app.module.ts
└── main.ts
```
## 📜 Scripts Disponíveis

| Script      | Descrição        |
|------------|------------------|
| start:dev  | Desenvolvimento |
| build      | Build            |
| start:prod | Produção         |
| test       | Testes           |
| lint       | ESLint           |


## 📊 Status do Projeto

| Módulo                    | Status        |
|---------------------------|---------------|
| Database                  | ✅ Completo   |
| Auth                      | ✅ Completo   |
| Users                     | ✅ Completo   |
| Games                     | 🟡 MVP        |
| Championships             | 🟡 MVP        |
| Funcionalidades Avançadas | 🔒 Desativadas |


## 📄 Licença
Projeto desenvolvido para fins educacionais e de portfólio.

<p align="center"> Desenvolvido com ❤️ usando NestJS </p> ```
