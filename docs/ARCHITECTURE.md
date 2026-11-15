# Mapa da implementação

## Diretórios

- `apps/web/src/pages`: coordenação das telas; `components`: controles e editor reutilizáveis.
- `apps/web/src/hooks/queries.ts`: consultas, mutações e chaves centralizadas; invalidação de todos os agendamentos após alterações. Login/logout preservam a query de sessão observada e removem as demais consultas privadas para evitar dados de outro usuário.
- `apps/web/src/api`: única fronteira HTTP; não há fetch em componentes.
- `apps/web/src/types`: contratos específicos da interface e validação do formulário local.
- `apps/web/src/styles`: tokens, tipografia, estilos globais e módulo de layout. Breakpoints de 760px (empilhamento) e 480px (padding) documentados no CSS.
- `apps/api/src/auth`: hashes, sessão validada no banco, autenticação e autorização de equipe.
- `apps/api/src/appointments`: rotas, controladores HTTP, regras de agendamento e apresentação pública.
- `apps/api/src/reports/service.ts`: rascunho, edição e publicação transacionais.
- `apps/api/src/database`: Prisma e consultas específicas, incluindo bloqueio da linha do agendamento.
- `packages/shared/src`: schemas Zod, contratos públicos em `contracts.types.ts`, duração e conversões de fuso em `scheduling.ts`.
- `apps/api/prisma`: schema, migração versionada e seed fictício.

## Autenticação e autorização

Login verifica scrypt e emite token aleatório; somente o hash do token é persistido em `sessions`. `authenticate` consulta sessão, validade e usuário em toda requisição protegida. `requireStaff` precede cada mutação de domínio. Origem exata é exigida em `app.ts` antes de qualquer mutação. Rate limiting no login reduz tentativas repetidas.

`visibleWhere` inclui `patientId` derivado da sessão nas consultas de pacientes. Nunca confia no parâmetro de filtro para definir propriedade. Recursos de outra pessoa retornam 404. `presentAppointment` constrói o DTO explicitamente e remove laudos não publicados para pacientes; nenhum hash ou sessão é serializado.

## Fluxo de agendamento

Formulário local → conversão IANA para UTC → API service do frontend → rota/controlador/Zod → serviço valida futuro, alinhamento e paciente/exame → Prisma insere → índice único parcial arbitra concorrência → P2002 vira HTTP 409 → TanStack Query invalida listas/detalhes. A restrição CHECK SQL também valida alinhamento.

## Fluxo de laudos e cancelamento

Controlador verifica equipe e valida corpo → transação Prisma → `SELECT ... FOR UPDATE` parametrizado na linha do agendamento → lê estado atualizado e laudo → valida invariantes → upsert de rascunho, publicação ou cancelamento → commit. Todas as operações usam o mesmo bloqueio; uma publicação não pode cruzar um cancelamento baseado em estado antigo. A segunda operação retorna conflito. Laudo publicado nunca é atualizado pelo serviço de rascunho. O banco exige um único laudo por agendamento e timestamp coerente com estado de publicação.

## Erros e testes

`app.ts` centraliza mensagens seguras, validação e conflitos do banco. `apps/api/tests/integration/api.test.ts` cobre banco real, concorrência, autorização, visibilidade, publicação, cancelamento, sessões e CSRF. `packages/shared/src/scheduling.test.ts` cobre conversão e alinhamento. Testes em `apps/web/src/test` cobrem login e edição/publicação com interação do usuário.
