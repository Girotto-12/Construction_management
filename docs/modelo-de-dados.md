# Modelo de dados proposto

Modelo lógico alvo para PostgreSQL/Supabase, ainda parcialmente implementado. A migração executável atual está em supabase/migrations/20261004155758_foundation.sql e contém apenas empresas, vínculos e sua autorização. As demais entidades abaixo são propostas e seguem as [regras de negócio](regras-de-negocio.md).

## Correspondência com o código atual

Supabase Auth usa auth.users; ainda não há tabela de perfil separada. companies usa created_by e create_request para criação idempotente. company_memberships tem chave primária composta company_id/user_id, role e active; não possui id ou status textual. A autorização de obras ainda não existe.

Na demonstração, WorkPackage representa grupo ou serviço com um único ambiente opcional. Serviço possui quantidade, peso, preço unitário e datas. Essa estrutura em memória não é o esquema final do banco. Entry e Cost são registros locais, sem autoria autenticada. Grupos da EAP só consolidam folhas; o peso da folha representa sua contribuição na obra.

## Convenções

- Identificadores estáveis e opacos; nomes não são chaves de relacionamento.
- Entidades de negócio carregam company_id; entidades de obra também project_id. Usuários são globais, ligados às empresas por vínculos.
- Datas de execução/planejamento são datas civis; timestamps de auditoria em UTC; fuso IANA na obra.
- Quantidades em decimal exato, por exemplo decimal(16,3), com precisão validada por unidade. Pesos em decimal(5,2). Escolha de tipos e restrições deve acompanhar cada migração; D2 definiu PostgreSQL/Supabase.
- Cadastros têm created_at/created_by; medições têm recorded_at/recorded_by. Exclusão em cascata não pode apagar histórico.

## Entidades do núcleo — E1 a E3

| Entidade | Campos principais | Vínculos e restrições |
| --- | --- | --- |
| users | id, auth_subject, display_name | Identidade única no provedor escolhido; senhas ficam fora do modelo de negócio. |
| companies | id, name, status | Limite de separação dos dados. |
| company_memberships | id, company_id, user_id, role, status | Um vínculo por empresa/usuário; admin ou member; pelo menos um admin ativo. |
| projects | id, company_id, name, start_date, target_end_date, timezone, status | active ou archived; entrega não anterior ao início. |
| project_memberships | id, company_id, project_id, company_membership_id, role, status | Um vínculo por obra/membro; manager, recorder ou reader; membro ativo da mesma empresa. |
| rooms | id, company_id, project_id, name, normalized_name, status | Nome normalizado único na obra, incluindo ambientes preservados. |
| units | code, label, decimal_places | Catálogo global controlado; m2, m3, point, stage; precisão não muda após uso em base publicada. |
| activities | id, company_id, project_id, name, unit_code, scope_mode, status | Modo room ou global; unidade e modo congelados após publicação. |
| activity_scopes | id, company_id, project_id, activity_id, room_id, status | Uma parcela por atividade/ambiente; global tem uma parcela com room_id nulo. |
| planning_baselines | id, company_id, project_id, version, status, published_at, published_by | draft ou published; versão única por obra; uma única base publicada no núcleo, sem revisão. |
| baseline_activities | id, company_id, project_id, baseline_id, activity_id, weight_percent | Uma linha por base/atividade; peso positivo; soma de 100% ao publicar. |
| baseline_quantities | id, company_id, project_id, baseline_activity_id, activity_scope_id, planned_quantity | Uma linha por atividade da base/parcela; previsto positivo e parcela da atividade indicada. |
| write_requests | id, company_id, project_id, idempotency_key, operation, payload_hash, actor_id, created_at, result_reference | Chave única por empresa; reserva e gravação transacionais; resultado referencia medições. |
| measurements | id, company_id, project_id, baseline_quantity_id, write_request_id, kind, quantity, execution_date, note, recorded_at, recorded_by, reverses_id, replaces_id, reason | execution positiva ou reversal negativa; imutáveis; vínculos explícitos para original e substituição. |
| audit_events | id, company_id, project_id opcional, actor_id, event_type, entity_type, entity_id, occurred_at, change_summary | Mudanças de acesso, publicação, arquivamento/reabertura e correções; não incluir segredos/tokens. |

baseline_quantity_id identifica atividade, parcela e base da medição. replaces_id aponta à execução substituída; estorno e substituição compartilham write_request_id. Execução comum também recebe solicitação própria.

## Extensão de EAP e custos — E8

| Entidade proposta | Campos principais | Restrições |
| --- | --- | --- |
| wbs_nodes | id, company_id, project_id, baseline_id, parent_id, code, name, activity_id opcional | Árvore sem ciclos; serviço associado uma vez à base; grupo não recebe custo direto. |
| baseline_costs | id, company_id, project_id, baseline_quantity_id, unit_cost_cents | Preço por unidade e escopo da mesma base; orçamento derivado, moeda definida na obra. |
| cost_entries | id, company_id, project_id, baseline_quantity_id, write_request_id, amount_cents, category, description, cost_date, recorded_at, recorded_by, reverses_id | Valor em centavos, vínculo à folha, autorização e repetição segura; estorno futuro explícito. |

Adicionar currency em projects. Política de revisões de preço/orçamento e alçadas depende de D10. Não criar uma tabela independente de totais por grupo como fonte primária.

## Relações e integridade

```text
companies → company_memberships → users
companies → projects → project_memberships → company_memberships
projects → rooms
projects → activities → activity_scopes → rooms (opcional no modo global)
projects → planning_baselines → baseline_activities → activities
baseline_activities → baseline_quantities → activity_scopes
baseline_quantities → measurements → write_requests
measurements → measurements (original, estorno e substituição)
```

Impedir referências cruzadas de empresa e obra com chaves estrangeiras compostas ou garantia equivalente. Por exemplo, company_id, project_id e activity_id da parcela devem corresponder à atividade referenciada. Repetir identificadores sem validar vínculos não oferece isolamento.

1. Garantir uma parcela por atividade/ambiente e uma parcela global por atividade. Tratar explicitamente unicidade com room_id nulo; não depender do comportamento padrão de nulos do banco.
2. Publicar a base em transação: validar modos, quantidades e soma dos pesos. Cada parcela ativa da atividade precisa estar representada uma vez. Congelar as linhas publicadas.
3. reverses_id é único quando preenchido; referencia execução positiva da mesma parcela e obra, com negativo exato da quantidade e mesma data. Não aponta a outro estorno.
4. replaces_id só aparece em substituição e corresponde ao original estornado na mesma solicitação. Destino pode mudar apenas dentro da mesma obra e base.
5. Pesos e saldos agregados exigem transação e coordenação de concorrência; validação isolada de linha não basta.
6. Autorizar cada operação pelos vínculos ativos. Integridade referencial sozinha não controla acesso.

## Transação de medição

1. Autenticar, resolver empresa/obra e verificar permissão e estado da obra.
2. Reservar chave de solicitação. Se existir, comparar conteúdo/operação e retornar resultado autorizado ou conflito.
3. Carregar base publicada e coordenar parcelas afetadas em ordem estável de identificadores.
4. Validar unidade, precisão, datas, escopo e acumulados. Em correção, calcular o efeito conjunto.
5. Inserir medições e auditoria, atualizar projeções derivadas se existirem e vincular resultado à solicitação.
6. Confirmar tudo junto. Em erro, desfazer reserva e mutações; permitir repetição segura.

Interface e futuras integrações usam o mesmo caminho. O cliente envia quantidade do apontamento, não um total acumulado confiável.

## Consultas derivadas

| Resultado | Fonte |
| --- | --- |
| Saldo da parcela | Previsto menos soma líquida de suas medições. |
| Avanço da atividade | Executado das parcelas dividido pelo previsto total. |
| Avanço da obra | Percentuais das atividades ponderados pelos pesos da base. |
| Histórico realizado | Acumulado por execution_date com pesos e denominadores da base. |
| Diário e correções | Medições, autoria, solicitação e vínculos original/estorno/substituição. |

Não criar fontes independentes para executado, percentual da planta e painel. Cache deve ser reconstruível.

Índices iniciais a avaliar: diário por empresa/obra/data, saldo por baseline_quantity_id/data, vínculos por usuário/empresa/obra e chaves únicas de idempotência. Otimizar com base no volume e nas consultas reais.

## Entidades da expansão

Propostas para etapas futuras; não implementar antecipadamente sem resolver suas decisões.

| Entrega | Entidades | Conteúdo e condições |
| --- | --- | --- |
| E4 | planned_distributions, planned_distribution_items | Versão aprovada por base; itens por parcela/data/quantidade; soma igual ao previsto. Pode começar manualmente, sem motor de cronograma. |
| E5 | plan_versions, plan_pages, room_annotations | Arquivo privado por obra, página e geometria normalizada ligada ao ambiente. Limites e versões em D7. |
| E6 | work_calendars, schedule_versions, schedule_items, schedule_dependencies | Dias úteis/exceções, duração, datas e vínculos entre itens; previsão separada da base física. D5 define granularidade. |
| E7 | resources, resource_capacities, resource_allocations, material_needs | Recursos por empresa, capacidade por data, alocações e necessidades de materiais. Política em D6. |

Mudança de cronograma pode propor distribuição planejada, com publicação explícita. Não sobrescrever distribuições aprovadas. Múltiplas bases físicas exigem definir vigência e compatibilidade das medições antes de ampliar o esquema.

## Dados de demonstração

Não importar dados fictícios por padrão para empresa real. Manter demonstração separada. Para verificar os 53% iniciais, carregar executados como medições identificadas e datadas. Percentuais ilustrativos de alvenaria/elétrica por ambiente não podem ser convertidos diretamente em quantidades confiáveis: preparar quantidades explícitas nos cenários.


## Contratos locais adicionais — 04/10/2026

Estes contratos TypeScript/armazenamentos não são tabelas implementadas no banco de produção.

| Contrato | Conteúdo e origem |
| --- | --- |
| Plan / PlanTask | planning.ts: revisão, moeda, início; atividade com ID, fase/responsável opcionais, duração, predecessoras, quantidade/unidade e peso |
| PlanResource | Recurso vinculado à atividade, tipo, quantidade, custo unitário, antecedência, deslocamento, duração, fornecedor, situação e transporte |
| Purchase | material-purchases.ts: ID, material, quantidade/unidade, valor total em centavos, fornecedor, data, fase, local, situação e File opcional |
| ImportRow | material-import.ts: linha original, item candidato, erros e indicação de duplicidade; só existe na revisão |
| PilotEvent | kitchen-pilot.ts: ID, elemento, confirmação/desfazer e instante; estado atual reconstruído pelo histórico |

Planejamento US usa obra-clara.planning.us.v1; rascunho antigo obra-clara.planning.v1 preservado. Compras e blobs usam IndexedDB obra-clara.material-purchases.v1 / purchases. Cozinha usa obra-clara.primrose-kitchen.v1. Obra original e cliente compartilham obra-clara.demo.v1.

Fase e local nas compras são textos, não chaves estrangeiras; vínculos da cozinha usam IDs fixos do modelo US. Antes da integração real, definir IDs estáveis de obra, versão, fase, ambiente e elemento, permissões e migrações. Não copiar esses registros diretamente para outra empresa nem confundir armazenamento local com isolamento de usuários.


## Preparação financeira — 04/10/2026

Decisão: gestão financeira da obra com integração contábil externa. Aplicados número de fatura, vencimento, impostos incluídos no total e valor pago por item, todos opcionais. Recebido não implica pago; valores ausentes permanecem não informados. Os comprovantes existentes são preservados. Sem exportação contábil, API ou pagamentos reais nesta entrega. O Excel atual permanece com nove colunas; complementar dados no editor. Detalhes, limites e sequência em [Integrações contábeis](integracoes-contabeis.md). Prioridade do núcleo permanece planejamento → aprovação/publicação → execução.


## Retirada de materiais — 04/10/2026

Rota /materiais/retiradas, acessível de Materiais e compras. Registra compra de origem, material/unidade, quantidade, data, responsável, fase/local de destino e observação. Saldo por compra = quantidade recebida integral menos retiradas. Só compras recebidas são elegíveis. Quantidade positiva com até três casas decimais, saldo suficiente e data não futura (Utah). Saída e rechecagem do saldo ocorrem em transação IndexedDB; não há integração de execução/custo/pagamento.

Banco obra-clara.material-purchases.v1 atualizado para versão 2 com store withdrawals, preservando purchases e anexos. Edição de compra com saídas bloqueia mudança de nome/unidade/situação e redução abaixo do retirado. Registros imutáveis nesta interface, sem estorno/devolução ou recebimento parcial ainda. Sem autenticação do responsável, compartilhamento ou estoque em produção. 20 testes e build aprovados; retirada local e persistência verificadas no navegador.
