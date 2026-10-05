# Plano de implementação

Estado em 04/10/2026: primeira implementação local concluída; E1 parcialmente implementada e ainda sem conexão a um projeto Supabase. Veja o [estado detalhado](estado-da-implementacao.md).

## Ponto de retomada — prioridade acordada em 04/10/2026

Concluir um fluxo de ponta a ponta: **planejamento → revisão/aprovação → publicação → execução registrada**. O modelo US, Gantt e editor são o ponto de partida. O piloto visual da cozinha será aprimorado depois, sem abrir novas frentes antes de estabilizar o núcleo.

1. Revisar EAP, escopos por ambiente, quantidades, pesos, unidades, dependências e recursos; apresentar pendências que impedem publicação.
2. Implementar publicação versionada e preservar a linha de base aprovada. Alterações futuras precisam mostrar impactos sem apagar o plano aprovado. Aprovação/publicação ainda não existem.
3. Vincular medições à versão publicada e ao ambiente/elemento, com saldo, correções rastreáveis e separação entre simulação e realizado.
4. Fazer curva física, datas previstas e visão do cliente consumirem a mesma base. Continuar ocultando valores financeiros do cliente.
5. Conectar compras aos serviços/custos sem dupla contagem, mantendo comprovantes e rastreabilidade.
6. Refinar a cozinha: medidas conferidas, elementos estáveis, instalações documentadas e atualização pelo registro real.

Infraestrutura pode avançar quando o responsável indicar sua organização Supabase: validar custo e destino, preparar persistência/autorizações e comprovar isolamento antes de dados reais. Não usar nada da Delta. Nenhum prazo foi prometido.

Critério de conclusão do próximo fluxo: criar/revisar um plano, publicar uma versão, registrar uma execução por ambiente, visualizar o mesmo resultado no painel e cliente e verificar que uma simulação ou revisão posterior não modifica o executado nem apaga a base aprovada. Demonstração local não equivale a conclusão de produção.

## Entregas

| Entrega | Dependências | Resultado | Critério de conclusão | Rastreabilidade |
| --- | --- | --- | --- | --- |
| E0 — Especificação | Protótipo | Requisitos, regras, dados e sequência | Rascunho escrito, revisado quanto à coerência e com decisões abertas. Validação do produto pendente. | Documentos desta pasta |
| E1 — Acesso e persistência | D1, D2 | Login, empresa, membros e autorização | Duas empresas isoladas em consultas/mutações; revogação funciona e dados persistem entre sessões. | RF01–02, RN01, RNF01 |
| E2 — Cadastro e base física | E1 | Obras, ambientes, atividades, parcelas e pesos | Publicar base válida, rejeitar pesos/escopos incorretos e preservar base publicada. | RF03–04, RN02–03 |
| E3 — Diário e avanço | E2, D3 | Medições, correções e indicadores | Passam os seis cenários do núcleo; recarga preserva dados, concorrência respeita saldo e correção conserva histórico. | RF05–07, RN04–07, RNF02–06 |
| E4 — Histórico e curva S | E3 | Distribuição planejada e série real | Conferir três datas, execução retroativa e correção; painel coincide com último ponto realizado; falta de plano não aparece como zero. | RF08, RN08 |
| E5 — Planta PDF | E3, D7 | Envio, versões e associação de ambientes | Marcar ambiente e consultar avanço; nova versão preserva anterior; acesso ao arquivo é autorizado. | RF09, RN09 |
| E6 — Cronograma | E2, D5 | Calendário, dependências e previsão | Cadeia de três atividades respeita calendário; ciclo é rejeitado; impactos são revisáveis e referência aprovada preservada. Integração com curva S depende de E4. | RF10, RN10 |
| E8 — Custos por EAP | E2, D10 | Orçamento e custos por serviço, com consolidação | Valores em centavos, agrupamento sem duplicação, permissão de lançamento e correção rastreável; custos não alteram avanço físico. | RF12, RN11 |
| E7 — Recursos e semana | E3, E6, D6 | Alocações e materiais necessários | Detectar conflito entre obras e abrir diário no contexto correto; planejamento não altera executado. | RF11, RN10 |

Status: E0 documentada e atualizada; E1 tem esquema, autorização e interface preparados, com testes locais. E2/E3/E8 têm fluxo demonstrativo, mas cadastro real, banco de obras e correções estão pendentes. E4–E7 não foram concluídas; a planta e a simulação demonstrativas não equivalem à entrega PDF. Há motor local término–início e Gantt, mas falta sua integração com publicação e execução. Não foi criado serviço em nuvem.

## Primeira entrega de implementação — E1

1. Registrar escolha de autenticação, banco, backend e ambiente em D2, com justificativa e execução local reproduzível.
2. Criar esquema de usuários, empresas e vínculos, migrações e dados de teste de duas empresas.
3. Implementar entrada/saída, sessão e contexto da empresa. Criação inicial produz empresa e primeiro administrador consistentemente.
4. Implementar autorização no serviço/dados e operações de consulta da empresa ativa e gestão de membros.
5. Verificar acesso autorizado, acesso negado entre empresas, revogação e persistência em nova sessão.
6. Atualizar instruções de execução e registrar evidência de conclusão.

Reutilizar a interface quando fizer sentido e substituir dados fixos conforme os fluxos passem a usar persistência. Manter separação explícita entre demonstração e uso real. Não simular isolamento somente no navegador.

## Decisões a validar

As decisões marcadas como confirmadas vieram do responsável nesta conversa. As demais propostas continuam abertas; resolver antes da etapa dependente.

| ID | Tema | Proposta ou questão | Impacto |
| --- | --- | --- | --- |
| D1 | Perfis e entrada | Admin da empresa; gestor, apontador e leitor por obra. Definir convite de membros e criação da empresa pelo primeiro administrador. | Fechamento de E1. |
| D2 | Tecnologia | Confirmado em 04/10/2026: Next.js + TypeScript, Supabase (PostgreSQL/Auth/arquivos) e Vercel. Combina interface web, dados transacionais e autorização por empresa. Organização Supabase será indicada depois; consultar custo antes de criar projeto. | E1 preparada localmente; infraestrutura pendente. |
| D3 | Diário | Proposta: execução imediata; correção por gestor/admin; retroativos desde início, sem futuro. Confirmar unidades e precisão com usuários. Aprovação intermediária exigiria estados próprios. | Antes de E3. |
| D4 | Escopo | Núcleo com uma base publicada imutável. Definir futuras mudanças de quantidades/pesos sem distorcer medições e comparações. | Não bloqueia base fixa; bloqueia revisão de escopo. |
| D5 | Cronograma | Término–início e dias úteis inicialmente. Definir granularidade por ambiente, defasagens, calendários e atividades sem peso físico. | Antes de E6. |
| D6 | Recursos | Pessoas ou equipes; capacidade diária ou horária; compartilhamento entre obras; bloqueio ou alerta. Materiais são necessidades, sem estoque. | Antes de E7. |
| D7 | Arquivos | Limites de tamanho/páginas, geometria, armazenamento e retenção do PDF. Confirmar prioridade e regras de fotos citadas na interface. | Antes de E5; fotos não incluídas implicitamente no núcleo. |
| D9 | Experiência da planta | Confirmado em 04/10/2026: planta existente recebe cores/elementos conforme execução registrada. Primeira interação implementada em SVG demonstrativo; importação do arquivo existente depende de E5. | Sem geração automática de arquitetura nesta entrega. |
| D10 | Custos | Confirmado: custo gerenciado pela EAP. Definir processo de orçamento, alçadas, correções, revisões e custo comprometido; primeira interação tem custos lançados e saldo. | E8. |
| D8 | Piloto | Empresas/obras participantes, volume, conectividade, metas de desempenho, backup e tempo/perda aceitáveis na recuperação. | Antes do uso real; núcleo requer conexão. |

Ao decidir, registrar data, responsável, escolha e motivo na tabela ou em documento ligado a ela. Ausência de resposta não aprova política de produto.

## Verificação

No núcleo, comprovar acesso, persistência e matemática com os [cenários de aceite](requisitos.md#cenários-de-aceite-do-núcleo). verify.cjs conserva referência da demonstração, sem validar banco, autenticação ou concorrência.

Em E4, conferir somas por data e correção retroativa. Em E5, verificar envio, acesso e preservação de versões. Em E6/E7, usar exemplos pequenos, como feriado no meio de uma dependência e equipamento reservado acima da capacidade.

Antes de usar dados reais, executar fluxo completo em celular/desktop, retirar ou rotular valores demonstrativos e comprovar restauração de backup conforme RNF07. Registrar resultados observados e limitações; não aprovar o que não foi verificado.

## Fora desta sequência

Assinaturas, contas a pagar/receber, fluxo de caixa, estoque completo, DWG/DXF, extração automática de quantidades e offline exigem escopo separado. Custos por EAP foram incluídos em E8. Fotos permanecem em D7.


## Preparação financeira — 04/10/2026

Decisão: gestão financeira da obra com integração contábil externa. Aplicados número de fatura, vencimento, impostos incluídos no total e valor pago por item, todos opcionais. Recebido não implica pago; valores ausentes permanecem não informados. Os comprovantes existentes são preservados. Sem exportação contábil, API ou pagamentos reais nesta entrega. O Excel atual permanece com nove colunas; complementar dados no editor. Detalhes, limites e sequência em [Integrações contábeis](integracoes-contabeis.md). Prioridade do núcleo permanece planejamento → aprovação/publicação → execução.
