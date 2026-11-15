# Testes

## Comandos

Na raiz: `npm ci`, `npm run db:generate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run format:check`.

`npm test` executa unitários da API (scrypt), unitários compartilhados (fuso/alinhamento) e React Testing Library (validação do login, feedback do servidor e salvar/confirmar publicação). O HTTP é simulado somente nos testes de interação de UI.

## Integração PostgreSQL real

1. `cp .env.example .env` se ainda não existir.
2. `docker compose up -d --wait`.
3. `npm run test:integration`.

O script aplica as migrações e executa Vitest em uma única instância, com `DATABASE_URL` substituída por `TEST_DATABASE_URL`. Exige base chamada `clinic_test`. Os testes apagam relatórios/agendamentos, carregam usuários/exames fictícios e autenticam pela API. Não há mocks do Prisma, PostgreSQL ou transações. As chamadas concorrentes usam Fastify inject, atravessam handlers reais e chegam ao mesmo PostgreSQL.

## Cenários

| Requisito                   | Evidência                                                                  |
| --------------------------- | -------------------------------------------------------------------------- |
| Duas marcações simultâneas  | respostas 201/409 e uma linha ativa persistida                             |
| Laudo de outro paciente     | 404 por ID, lista própria vazia                                            |
| Rascunho invisível          | GET laudo 404, DTO sem texto e sem estado DRAFT                            |
| Publicação visível ao dono  | conteúdo publicado e timestamp; edição/cancelamento/republicação 409       |
| Data passada                | HTTP 422                                                                   |
| Slot cancelado reutilizável | nova marcação aceita no mesmo instante                                     |
| Um laudo por exame          | dois saves simultâneos, uma linha, edição posterior                        |
| Publicação × cancelamento   | oito corridas em ordens alternadas; um sucesso, um conflito, estado válido |
| Autorização                 | paciente não cria/cancela/edita/publica nem acessa diretório               |
| Validação                   | campos obrigatórios, alinhamento, erros sem stack                          |
| Sessão e CSRF               | cookie falso, falta de sessão, expiração, logout e Origin externo/ausente  |
| Filtros                     | data local, paciente e impossibilidade de trocar propriedade pelo filtro   |

Não use banco mockado para testar unicidade ou corridas. Não reutilize base de desenvolvimento para integração.

## Registro de execução

Verificação realizada em 15/11/2026:

- 8 testes unitários/UI: 1 senha, 3 fuso/alinhamento e 4 interações React, incluindo regressão de login/logout e remoção de cache privado.
- 13 testes de integração passaram usando PostgreSQL **real 18.6** nativo em diretório temporário, incluindo os cinco cenários obrigatórios e as corridas de publicação/cancelamento.
- Migração aplicada a bases vazias (`clinic_test` e `clinic`); seed executado na base de demonstração. Nova execução preserva os IDs dos dados de exemplo.
- TypeScript estrito, ESLint, builds de frontend/API e Prettier verificados.
- Auditoria npm na instalação: nenhuma vulnerabilidade reportada.
- Instalação `npm ci`, geração Prisma, verificações e builds também executados em cópia limpa sem `node_modules`, `.env`, `.git` nem artefatos compilados provenientes do projeto original.
- Chrome headless local, fluxo integrado com frontend, API e banco reais: login equipe → agendar → salvar e editar rascunho → confirmar publicação → logout → login paciente → ler laudo → negar leitura por outro paciente → cancelar outro agendamento.
- Navegador configurado em America/Los_Angeles mostrou corretamente os horários da clínica em America/Sao_Paulo. Layout de 390px sem overflow; sem exceções JavaScript não tratadas. Capturas em `docs/screenshots/`.

A imagem Compose PostgreSQL 17 e o workflow GitHub Actions foram fornecidos, mas não executados neste ambiente. Docker Desktop estava indisponível. O Vite emite avisos de anotações PURE na dependência Zod; eles não impedem o build.
