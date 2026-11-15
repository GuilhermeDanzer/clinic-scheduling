# Clínica — agendamentos e laudos

Aplicação do desafio técnico: equipe agenda exames e publica laudos; pacientes consultam apenas seus próprios exames e laudos publicados. Interface em português brasileiro.

## Requisitos

Node.js 22.20+ e npm 10+, Docker com Compose. Portas locais: web 5173, API 3001, PostgreSQL 5434 e testes 5435.

## Instalação e execução

```sh
npm ci
cp .env.example .env
docker compose up -d --wait
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Abra http://localhost:5173. A API escuta em 127.0.0.1:3001; o Vite encaminha `/api` para ela. Execute comandos na raiz do projeto. A migração usa `migrate deploy`, incluindo o índice parcial escrito em SQL; não substitua por `db push`.

O seed é idempotente por identificadores estáveis e não remove dados existentes. Na primeira execução, os exemplos ficam sete dias no futuro: rascunho, publicado, cancelado e exame de outro paciente. Reexecuções preservam os exemplos existentes. Credenciais são redefinidas apenas no seed local; o seed recusa `NODE_ENV=production`.

## Contas de demonstração (somente desenvolvimento)

| Perfil | E-mail              | Senha       |
| ------ | ------------------- | ----------- |
| Equipe | equipe@clinica.test | Clinica123! |
| Ana    | ana@clinica.test    | Clinica123! |
| Bruno  | bruno@clinica.test  | Clinica123! |

## Configuração

`.env.example` não contém segredos reais. `DATABASE_URL` aponta para a base local; `TEST_DATABASE_URL` deve apontar para uma base separada chamada `clinic_test`. `APP_ORIGIN` é a origem exata permitida para mutações, `PORT` a porta da API e `NODE_ENV` controla cookies seguros. As contas de demonstração nunca devem ser usadas em produção.

Datas entram pela interface como horário de `America/Sao_Paulo`, são convertidas com a base IANA e persistidas em UTC (`timestamptz`). Listas e filtros usam o mesmo fuso, independentemente do fuso do dispositivo. A clínica tem uma sala, aceita qualquer dia/horário futuro, em intervalos alinhados de 30 minutos; não foram inventados horários de abertura.

## Verificação

```sh
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
npm run format:check
```

Os testes de integração aplicam migrações e **apagam agendamentos e laudos de `clinic_test`**. Nunca aponte essa configuração para dados de trabalho. O script recusa outro nome de base. Veja [TESTING](docs/TESTING.md).

## Estrutura e decisões

React/TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod e CSS Modules no frontend. Fastify, Prisma e PostgreSQL no backend. npm workspaces, contratos compartilhados, ESLint, Prettier e Vitest.

Veja [ARCHITECTURE](docs/ARCHITECTURE.md), [DECISIONS](docs/DECISIONS.md) e [plano](docs/IMPLEMENTATION_PLAN.md).

## Build e implantação

`npm run build` gera `apps/web/dist` e `apps/api/dist/server.js`. Sirva o frontend e a API sob uma única origem HTTPS: o proxy deve remover `/api` antes de encaminhar à API, servir assets e retornar `index.html` para rotas do React. Execute a API com `NODE_ENV=production`, `APP_ORIGIN=https://sua-origem` e `DATABASE_URL` do ambiente; `node --env-file=.env apps/api/dist/server.js`. Não publique o Vite de desenvolvimento. O exemplo Compose é exclusivamente local.

## Limitações e escopo

Sem cadastro público, recuperação de senha, anexos, PDF, assinatura digital ou validação clínica. Sessões de oito horas, tokens aleatórios armazenados somente como SHA-256, senha com scrypt, cookie HttpOnly/SameSite Strict (Secure em produção). Localhost HTTP usa cookie sem Secure para funcionar no desenvolvimento. A API exige Origin nas mutações, inclusive em clientes HTTP diretos. Não há rotina automática para remover sessões expiradas; elas são rejeitadas a cada requisição. Sem implantação externa ou envio de e-mail nesta entrega.

Verificação: 21 testes passaram (8 unitários/UI e 13 integrações com PostgreSQL real), além de TypeScript, lint, formatação, builds, instalação limpa e walkthrough real no Chrome em desktop e mobile. Detalhes e limites em [TESTING](docs/TESTING.md). Auditoria npm sem vulnerabilidades reportadas na instalação.

Neste computador, Docker Desktop não iniciou. Os testes usaram PostgreSQL nativo 18.6 temporário; o Compose PostgreSQL 17 permanece como configuração local padrão, sem afirmar que seu startup foi verificado aqui. O frontend tem alvo ES2022 (navegadores modernos).

Tempo registrado: aproximadamente 30 minutos de execução ativa em 15/11/2026, incluindo implementação, restauração e verificações; calculado a partir dos registros de execução e excluindo o intervalo de pausa entre rollback e restauração. Não corresponde a horas estimadas nem a três dias de trabalho.
