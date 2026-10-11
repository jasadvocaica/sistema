# Integração DataJud

O projeto de produção é JAS (`mzwnljgujheumdslkloc`). O DataJud fornece metadados e movimentações processuais; publicações e intimações do DJEN são uma integração distinta.

A função `datajud-consulta` valida usuários com `getUser`. Consultas manuais exigem perfil ativo e gestor ou responsável pelo processo. O agendamento valida exclusivamente o segredo `datajud_cron_secret` mantido no Vault, sem expô-lo ao navegador.

O job `datajud-diario` executa a cada hora e consulta dois processos ativos, priorizando a consulta mais antiga. Com os oito processos atuais, uma rodada completa leva aproximadamente quatro horas. O botão de consulta manual trata o próximo processo; a consulta individual permanece disponível no processo.

O cliente compartilhado consulta o CNJ numérico e formatado na mesma requisição, combina movimentos de graus distintos e tenta novamente uma vez para erros de rede, 429, 502, 503 e 504. Cada tentativa tem limite de 65 segundos. Erros de autenticação não são repetidos. Falhas de gravação não são apresentadas como sucesso; o índice único existente impede duplicação entre execuções simultâneas.

A variável `DATAJUD_API_KEY` prevalece sobre a chave pública de fallback do CNJ. O CNJ pode atualizar essa chave e apresentar indisponibilidade ou atraso de alimentação pelos tribunais. Processos ausentes são identificados no cadastro, sem fabricar movimentos ou publicações.

Validação: testes de normalização/tribunais e de recuperação da API; build do frontend; consulta real de processo no Supabase com log concluído sem erros. A frequência está documentada na migration `20261011234718_datajud_rotacao_horaria.sql`.
