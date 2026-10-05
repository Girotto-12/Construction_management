# Documentação do Obra Clara

Atualização: 04/10/2026. Produto voltado inicialmente à construção residencial nos Estados Unidos, com contexto inicial em Utah. Inglês americano, USD e unidades imperiais são a direção do produto; a interface ainda está parcialmente em português e a demonstração original conserva BRL e unidades métricas.

## Decisões confirmadas

- Projeto exclusivo do responsável, independente da Delta. Não reutilizar contas, infraestrutura, dados ou identidade da Delta.
- Next.js e TypeScript; Supabase e Vercel escolhidos. Organização própria do Supabase pendente, sem serviço dedicado criado ou implantação em nuvem.
- Avanço visual representa execução registrada. Simulação de cronograma nunca cria medições.
- Custos vinculados à EAP. Visão do cliente sem valores financeiros.
- Evoluir por fluxos completos. Prioridade: planejamento → revisão/aprovação → publicação → execução registrada.
- Manter o piloto visual da cozinha como referência e aprimorá-lo conforme o núcleo avança.

## Estado por área

| Área / rota | Disponível localmente | Limites |
| --- | --- | --- |
| Obra /demo | Planta SVG, diário, medições, EAP, custos e curva física | Dados fictícios; curva planejada linear da base original |
| Planejamento /planejamento/demo | Modelo US com 50 atividades, 12 fases, 8 recursos, dependências, EAP expansível e Gantt | Sem publicação, baseline, caminho crítico, feriados ou arraste de barras |
| Materiais /materiais/demo | Compras, fase, local, situação, comprovante e importação Excel com revisão | Não importa necessidades da EAP automaticamente nem gera custos/estoque |
| Cozinha /modelo/demo | Camadas, rotação, drywall transparente, simulação por datas e registros reversíveis | Geometria aproximada; não é BIM nem importação automática do PDF |
| Cliente /cliente/demo | Avanço, etapas, entrega planejada e atualizações sem custos | Não é portal autenticado de produção |
| Clima | NWS, Alpine UT, sete dias, °F/°C e cores suaves | Não altera datas automaticamente |
| Empresas | Esquema RLS e autenticação preparados | Validação integrada em nuvem e autorização por obra pendentes |

Os módulos têm armazenamentos separados. Navegar entre eles não significa que compras, medições ou versões do planejamento estejam integradas. Dados locais pertencem à origem do navegador; não são sincronizados entre dispositivos.

## Retomada após a pausa

Consulte [Ponto de retomada](retomada.md) para estado atual, próximos passos e limitações.

## Leitura

| Documento | Conteúdo |
| --- | --- |
| [Estado da implementação](estado-da-implementacao.md) | Entregas, testes, persistência e limitações |
| [Planejamento residencial](planejamento-residencial.md) | Calendário, Gantt, recursos, Excel e piloto visual |
| [Requisitos](requisitos.md) | Escopo e critérios de aceite |
| [Regras de negócio](regras-de-negocio.md) | Medições, custos, compras e simulação |
| [Modelo de dados](modelo-de-dados.md) | Entidades previstas e contratos locais existentes |
| [Plano de implementação](plano-de-implementacao.md) | Prioridade atual e sequência de conclusão |

Última verificação do código: compilação aprovada e 20 testes passaram. Checkpoint de código e documentação preparado para GitHub. Testes locais não comprovam isolamento real, capacidade de 5.000 usuários, backup ou produção.


## Preparação financeira — 04/10/2026

Decisão: gestão financeira da obra com integração contábil externa. Aplicados número de fatura, vencimento, impostos incluídos no total e valor pago por item, todos opcionais. Recebido não implica pago; valores ausentes permanecem não informados. Os comprovantes existentes são preservados. Sem exportação contábil, API ou pagamentos reais nesta entrega. O Excel atual permanece com nove colunas; complementar dados no editor. Detalhes, limites e sequência em [Integrações contábeis](integracoes-contabeis.md). Prioridade do núcleo permanece planejamento → aprovação/publicação → execução.
