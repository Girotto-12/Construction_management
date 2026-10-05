# Planejamento por modelo residencial

Primeira versão disponível em /planejamento/demo, pelo link Planejamento do painel. O responsável escolheu começar a partir de um modelo; o modelo atual é residencial americano, com 50 atividades em 12 fases e oito recursos de exemplo. O antigo modelo BRL de 142 m² permanece como referência legada.

## O que pode ser adaptado

- Nome e início do rascunho.
- Cinquenta atividades iniciais, com quantidade, unidade, peso físico, duração e predecessoras. Adicionar, editar e remover serviços sem vínculos pendentes.
- Materiais: quantidades, preços, fornecedor, serviço, data necessária e antecedência de compra.
- Contratações: escopo, responsável, quantidade, preço, período e situação planejada.
- Equipes: quantidade, diária e alocação por serviço.
- Máquinas: quantidade, diária, retirada/devolução calculadas, antecedência de reserva e transporte.

## Regras desta primeira versão

Calendário de segunda a sexta, sem feriados. Dependências término–início: sucessoras iniciam no próximo dia útil depois da última predecessora. Serviços sem dependência iniciam junto à obra. Ciclos e predecessoras inexistentes são rejeitados. O prazo final é a maior data de término dos serviços.

A duração é de 1 a 365 dias úteis por serviço. A alocação informa deslocamento a partir do início e duração, em dias úteis, e deve caber no serviço. Reduzir a duração abaixo do período de um recurso exige ajustar o recurso primeiro. Não há ajuste silencioso de quantidades ou períodos.

Materiais e contratações: quantidade × preço unitário. Equipes: quantidade × diária × dias úteis alocados. Máquinas: quantidade × diária × dias corridos entre retirada e devolução, inclusive fins de semana, mais transporte total. O preço unitário zero indica estimativa ainda não preenchida, não cotação de mercado.

O prazo de compra/reserva é a data inicial da necessidade menos a antecedência em dias corridos. Não é ajustado por feriados ou dias úteis do fornecedor. Recursos com o mesmo tipo, nome e fornecedor em períodos sobrepostos produzem aviso de possível conflito para equipes e máquinas. Ainda não há controle de capacidade por equipamento individual ou compartilhamento entre obras.

Pesos diferentes de 100% geram aviso; rascunhos incompletos podem ser salvos. Gravação rejeita valores inválidos, períodos fora do serviço e dependências circulares. Remover serviço vinculado exige retirar suas dependências e recursos antes.

## Persistência e separação

O rascunho usa localStorage na chave obra-clara.planning.us.v1. A chave antiga obra-clara.planning.v1 é preservada sem migração automática. Salva somente depois da validação e mantém revisão para detectar edição desatualizada. Web Locks coordena gravações entre abas quando disponível. O modelo é carregado novamente após recarga; registros inválidos são preservados e bloqueiam edição.

É separado de obra-clara.demo.v1. Não altera medições, custos lançados, curva de avanço ou página do cliente. A publicação de uma base revisada na obra ainda está pendente. Nenhuma compra, contratação, reserva externa ou pagamento é feito pela interface.

A moeda do modelo atual é USD. O modelo legado usava BRL. Valores, quantidades e prazos são exemplos editáveis; não são orçamento executivo, dimensionamento técnico ou cotações. Alterar a quantidade de um serviço não altera automaticamente seus materiais. O total soma apenas os recursos cadastrados; não representa o custo completo da obra. Separar escopos de contratação dos materiais/equipes para evitar dupla contagem.

## Verificação histórica do modelo legado

Testes de calendário, paralelismo, recálculo de sucessoras, ciclos, duração insuficiente para recursos, persistência, antecedência de compra, diárias com fim de semana e conflitos. Nove testes da aplicação passaram; compilação e tipos aprovados.

No navegador, fundações alteradas de 15 para 20 dias úteis mudaram a entrega de 26/02/2027 para 05/03/2027, preservada após recarga. Diária da miniescavadeira alterada de R$ 850 para R$ 900 recalculou cinco dias mais R$ 1.200 de transporte para R$ 5.700. Conferidos formulário e página em 360 px sem excesso de largura.

## Continuidade

Publicação e versão da base com revisão de impactos; vínculo aos ambientes e à planta; feriados/calendários; orçamento completo; composições de materiais; cotações comparativas; identificação e capacidade real dos recursos; banco, autorização e compartilhamento entre usuários. A sequência será ajustada conforme a revisão do modelo pelo responsável.


## US residential template — 2026-10-04

The default is now an original 50-activity, 12-phase single-family residential template. Activity names and trade responsibilities are in English; currency is USD and example materials use sq ft and cu yd. Navigation and editor labels still require full English localization.

Sources used as workflow references, not copied schedules or official durations:
- https://pro.houzz.com/pro-learn/blog/startup-guide-residential-construction-schedule-template
- https://www.ganttile.com/templates/construction-schedule
- https://buildnaz.com/docs/resources/ConstructionSchedule.pdf
- https://alpineut.gov/157/Building-Department

Durations, procurement lead times, quantities and physical weights are illustrative. Verify inspection requirements, curing, weather, holidays and subcontractor availability for each project. Inspection activities reserve time; they do not constitute approvals or automatic execution gates. All costs start at zero and are displayed as pending quotes. Tasks use lot quantities until measured quantities are supplied. Weights total 100, with no physical credit for procurement or inspections.

Storage key obra-clara.planning.us.v1 separates this draft from the previous obra-clara.planning.v1, which is left untouched. The execution demo remains independent. Publishing a plan, real resource capacity, region calendars, and client progress integration remain future work.


## EAP visual e Gantt — 2026-10-04

Implementados agrupamento por fase com expandir/recolher, barras de datas planejadas, três níveis de zoom e consulta de predecessoras/sucessoras. Clicar no nome abre o editor de atividades; salvar recalcula as barras pelo motor existente. A tabela detalhada permanece disponível em seção expansível. Fases são resumos derivados (não serviços adicionais nem pesos duplicados). Calendário visual usa dias corridos e agendamento continua segunda a sexta.

Validação: build e 10 testes aprovados; navegador verificou 12 fases recolhidas, expansão, seleção, edição com recálculo e persistência, e viewport móvel sem overflow da página. Sem arraste de barras, setas de dependências, caminho crítico, baseline, marcos zero-dia ou calendários personalizados nesta entrega.


## Importação Excel de materiais — 2026-10-04

A página /materiais/demo oferece download de public/templates/materials-template.xlsx e importação XLSX local (2 MB, 500 linhas). Aba Materials vazia; Instructions contém orientações, exemplo não importável e fases padrão. Dropdowns para fase/status; fases personalizadas são validadas contra o planejamento local.

Antes de confirmar, a prévia mostra valores e erros por linha. Erros bloqueiam o lote inteiro. Linhas com todos os campos normalizados iguais são ignoradas, inclusive dentro do arquivo e na rechecagem transacional do IndexedDB. Importação adiciona itens e não atualiza compras existentes. Anexos continuam manuais por item. Valores vazios, fórmulas, datas inválidas, fases desconhecidas e valores com precisão indevida são rejeitados.

Validação: 12 testes aprovados; template exportado e reaberto com dropdowns; upload real no navegador, nenhuma escrita antes de confirmar, confirmação persistida e reimportação ignorada. XLSX gerado por Artifact Tool; namespaces XML normalizados para compatibilidade com ExcelJS. Não verificado no aplicativo nativo Microsoft Excel. ExcelJS carregado sob demanda. npm audit aponta dependência transitiva uuid com aviso moderado de bounds em APIs v3/v5/v6; não foi aplicado downgrade incompatível automático. Antes da produção revisar biblioteca de importação e processamento de arquivos grandes/hostis.


## Piloto visual da cozinha Primrose — 2026-10-04

Rota /modelo/demo, acessível pelo planejamento. Modelo paramétrico esquemático projetado em SVG, câmera ajustável, duas paredes, abertura da pia, framing, trajetos ilustrativos de hidráulica/elétrica, drywall e piso. Referência visual A1.2 do PDF fornecido; pé-direito 10 ft identificado. Dimensões horizontais de 14.54 x 12 ft são aproximações de protótipo; não é reconstrução BIM nem extração automática do PDF. Não utilizar para quantitativos. O PDF original não foi publicado no app.

Simulação usa datas finais das atividades wall-frame/plumbing/electrical/drywall/flooring do planejamento local. Execução usa sete elementos próprios e eventos persistidos na chave obra-clara.primrose-kitchen.v1; desfazer gera outro evento. Nenhum percentual ou lançamento é propagado à obra ou ao portal do cliente. Registros dependem de confirmação manual e não certificam inspeções. Transparência do drywall permite examinar camadas.

Verificações: build e 14 testes passaram; navegador confirmou simulação sem escrita, registro persistente, mudança de camada e viewport móvel sem overflow. Próxima validação: medidas e identificação dos elementos com o usuário antes de modelagem fiel e integração de medições à EAP.

## Prioridade após revisão do piloto visual

O responsável aprovou o piloto como começo e pediu evolução incremental conforme o projeto avança. Manter o modelo como teste de interação. Antes de ampliar a casa: concluir revisão, aprovação/publicação e execução vinculada ao plano. Melhorias futuras da cozinha: conferir medidas, identificar elementos de forma estável, substituir trajetos ilustrativos por projetos de instalações e conectar medições verificadas à EAP e ao resumo do cliente.

Inserção de atividades: a ação Insert below / Inserir abaixo abre o formulário e posiciona a nova atividade após a escolhida na mesma fase. Predecessoras são escolhidas explicitamente; posição visual não implica sequência de execução.
