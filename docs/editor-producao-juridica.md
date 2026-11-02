# Área de produção jurídica

Implementação em `/documentos/pecas/novo` e `/documentos/pecas/:id`.

- Editor A4 com ajuste à largura, zoom e modo de tela cheia.
- Lateral recolhível com contexto, assistente e revisão; em telas menores fica abaixo do editor.
- Contexto salvo em `doc_pecas.contexto_producao`: tarefa de origem, determinação judicial, objetivos, fatos/documentos transcritos, orientações, datas informadas, fontes e checklist.
- A ação **Produzir minuta** na Controladoria abre o editor com cliente, processo e tarefa. A descrição e as orientações disponíveis são copiadas; o prazo continua exigindo conferência. A peça não conclui nem altera a tarefa.
- Sugestões da IA têm prévia e aplicação explícita. Antes de substituir ou restaurar, o rascunho atual é salvo; a operação transacional registra antes/depois. Falhas preservam o texto na tela.
- Autosave após três segundos também cobre metadados e contexto. O primeiro salvamento é manual, após informar título e cliente. Ctrl/Cmd+S salva. Erros são visíveis e interrompem novas tentativas automáticas até o salvamento manual.
- `atualizado_em` é comparado dentro de um bloqueio da linha para rejeitar gravações de sessões desatualizadas. A RPC usa `SECURITY INVOKER`, respeita RLS e reverte snapshots se houver erro.
- Histórico mostra prévia sem alterar a minuta; restauração cria outra versão. O número da versão pode avançar duas posições porque são preservados o estado anterior e o resultado.
- Comentários podem referenciar um trecho selecionado. Autor ou gestão podem resolver/reabrir, conforme as políticas já existentes.
- Checklist, pendências de preenchimento, comentários abertos e conferência do prazo são verificados na aprovação. Aprovar, finalizar e registrar protocolo exigem advogado/gestão também no banco. Documentos finalizados exigem reabertura para edição; protocolados permanecem bloqueados.
- Word continua sendo exportação local; PDF usa impressão do navegador. Registro de protocolo exige informar sua data e não envia arquivos ao tribunal.

## Ativação no ambiente publicado

A migração e a função foram ativadas no projeto JAS em 02/11/2026, após autorização. O teste transacional no banco real confirmou criação, salvamento, versões e rejeição de gravações desatualizadas; os dados de teste foram revertidos. A publicação do frontend é feita pelo workflow `Publicar sistema` ao atualizar `main`.

Componentes da publicação:

1. A migração `supabase/migrations/20261102141741_documentos_workspace.sql`.
2. A Edge Function `documentos-assistente` e sua configuração em `supabase/config.toml`.
3. O frontend atualizado.

Na verificação da publicação, `LOVABLE_API_KEY` ainda não estava configurada no projeto. O editor, o salvamento e a revisão funcionam independentemente; a geração por IA depende dessa configuração.

A função precisa de `LOVABLE_API_KEY` no servidor e das variáveis padrão do Supabase. Não expor a chave no frontend. A consulta GET à função retorna apenas `status` e `ia_configurada`, sem credenciais nem dados de clientes; POST continua exigindo autenticação. Ela valida a sessão com `getUser`, usa o JWT do usuário e a chave anon para todas as consultas, e confere a permissão de editar documentos. Não usa `service_role`, não salva nem protocola.

Antes de publicar, testar em homologação com perfis reais de estagiária e advogado, confirmar as políticas existentes de clientes/processos/comentários e testar salvamento em duas sessões. A migração é aditiva, mas reforça transições de status também em outras telas que gravem `doc_pecas`.

## Limites atuais da assistência

O repositório de leis ainda **não foi importado nem indexado**. A IA recebe a minuta, nome do cliente, identificação básica do processo e os trechos informados no contexto. Links não são buscados; anexos não são lidos automaticamente. A interface identifica essas condições. Não existe cálculo automático de prazo ou acionamento automático após DJEN nesta entrega.

A última sugestão e suas pendências são salvas com o contexto. A IA não confirma vigência de fontes, não inventa prova e deve marcar lacunas como `[INSERIR: ...]`. A revisão final é humana.

## Verificação

Para instalar as dependências neste projeto, use `npm ci --legacy-peer-deps`. Existe um conflito prévio entre `date-fns` 4 e o peer declarado por `react-day-picker` 8; atualizar o calendário fica fora desta alteração. O editor não depende desse calendário.

```bash
npx vitest run src/pages/documentos/workspace.test.ts src/pages/documentos/PecaForm.test.tsx
npx vitest run src/lib/documentos-export.test.ts
npm run test:documentos:db
npm run test:documentos:edge
npm run build
```

O teste do banco usa PostgreSQL WASM em memória, sem conexão ao projeto remoto. Valida criação, snapshots, rollback, concorrência, vínculos, RLS, aprovação, reabertura e protocolo. O teste da função executa o handler real com banco, Auth e provedor simulados, sem requisições externas. Isso não substitui a homologação com as políticas e credenciais do ambiente publicado.

As dependências do TipTap foram alinhadas na versão principal 3: a extensão Typography estava declarada na versão 2, em conflito com o editor. O lockfile npm foi sincronizado com o manifesto para permitir instalação reproduzível.
