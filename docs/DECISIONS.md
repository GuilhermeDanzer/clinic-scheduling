# Decisões

- PostgreSQL e Prisma: operações simples tipadas, SQL explícito apenas para o índice parcial e bloqueio de linha. Não usar apenas pre-check de disponibilidade: o índice versionado é a autoridade sob concorrência.
- Bloqueio pessimista do agendamento em READ COMMITTED: um único recurso compartilhado serializa edição/publicação/cancelamento. Mais simples que retries seriais e suficiente para uma clínica de uma sala. Todos os caminhos de escrita do domínio usam esse bloqueio; escritas externas diretas fora da aplicação não fazem parte do contrato.
- Sessões persistidas em vez de JWT: revogação simples no logout e checagem de validade no servidor. Entidade Session é a infraestrutura mínima adicional aos quatro modelos de domínio.
- Mesma origem via proxy: evita CORS desnecessário e permite política Origin estrita + cookie SameSite Strict para CSRF. Ausência de Origin em mutações também é rejeitada.
- Cookies Secure em produção HTTPS; desenvolvimento localhost HTTP é exceção explícita para execução local.
- Zod e contratos compartilhados para entradas/DTOs. Enums Prisma permanecem no schema porque são necessários para gerar tipos e DDL; respostas são tipadas contra o contrato compartilhado para detectar divergência.
- `America/Sao_Paulo` com biblioteca de fuso IANA, nunca deslocamento UTC fixo; armazenamento timestamptz e filtros por limites locais de dia.
- Sem horários de abertura, registro público ou funcionalidades clínicas extras. A publicação pode ocorrer em qualquer agendamento ativo, pois o PDF não impõe realização prévia do exame.
- Retorno 404 para recurso ausente, de outro paciente ou laudo ainda invisível: não revela existência a terceiros.
- CSS Modules e tokens sem biblioteca de UI; confirmação nativa acessível para ações irreversíveis. Sem estado global adicional: sessão e domínio ficam no TanStack Query.
- Build da API com tsup para incorporar o pacote TypeScript compartilhado; frontend com Vite. Não há framework genérico de repositório nem container DI.
- Execução e entrega locais. A avaliação solicita repositório/arquivo; não exige hospedagem. Nenhum e-mail é enviado automaticamente.

- Versões de validação e testes atualizadas após auditoria. Overrides restritos às dependências transitivas vulneráveis (`deepmerge-ts`, `effect`, `minimatch`, `esbuild`), validados em instalação limpa, testes e builds. O frontend tem alvo ES2022 no build e no otimizador de desenvolvimento, compatível com a versão corrigida de esbuild. Revisar esses overrides ao atualizar as ferramentas; removê-los quando os pacotes de origem incorporarem as correções.
- A duração é uma regra fixa do desafio: `scheduling.slotMinutes` é a definição usada pela aplicação; o CHECK SQL versionado registra a mesma regra no banco. Alterar a duração exige uma migração correspondente.
