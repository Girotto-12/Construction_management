# Estado da implementação — 04/10/2026

## Situação consolidada

O núcleo original, o planejamento US, as compras e o piloto visual funcionam como demonstrações locais separadas. Não há fluxo publicado de planejamento para execução nem integração automática das compras com custos. A prioridade acordada é concluir esse fluxo antes de ampliar o modelo visual.

- Planejamento: 50 atividades / 12 fases / 8 recursos, USD, dependências término–início, Gantt com zoom, fases recolhíveis e inserção abaixo de uma atividade na mesma fase. A posição da linha não cria dependência.
- Compras: fase e local, fornecedor, quantidade, valor, situação e um comprovante PDF/JPG/PNG/WebP até 10 MB. Permite substituir e baixar o anexo.
- Excel: template .xlsx em inglês, até 500 itens e 2 MB, prévia antes de confirmar, erros bloqueiam o lote e duplicados idênticos são ignorados. Comprovantes são anexados depois. Não atualiza compras existentes.
- Cozinha Primrose: duas paredes, framing, instalações ilustrativas, drywall e piso. Simulação usa término das atividades vinculadas; execução usa sete elementos próprios, com histórico de confirmação e desfazer. Não altera o avanço geral nem a visão do cliente.
- Geometria: referência A1.2 do PDF fornecido, pé-direito 10 ft; dimensões horizontais aproximadas de 14.54 × 12 ft. Conferência das medidas e trajetos reais permanece pendente. O PDF não foi publicado no aplicativo.

## Núcleo demonstrativo original

Primeira aplicação Next.js com fluxo demonstrativo completo: selecionar ambiente, registrar quantidade, atualizar planta/avanço, lançar custo, conferir a EAP e recuperar os registros após recarregar.

A demonstração usa a Residência Horizonte, com cinco ambientes e vinte serviços distribuídos em cinco etapas. Os pesos dos serviços somam 100%. Grupos não duplicam quantidades, pesos ou valores das folhas.

Tecnologia implementada: Next.js 16, React 19, TypeScript, Decimal.js para operações de quantidades e pesos; valores monetários armazenados em centavos inteiros. Versões exatas estão no lockfile.

## Planta e cronograma do núcleo original (/demo)

Alvenaria, elétrica e pisos têm quantidades próprias por ambiente. A seleção abre o serviço correspondente no formulário. Cor e elementos representam o percentual do ambiente, sem afirmar a localização exata de cada serviço.

Executado por data usa somente registros acumulados. Planejado é uma simulação linear entre início e fim de cada serviço; não considera calendário útil, dependências ou capacidade. Visualizar o futuro não cria registros nem altera o avanço físico atual.

Importação de PDF, marcações de ambientes e versões de plantas ainda não foram implementadas. A planta disponível é o desenho demonstrativo em SVG.

## Custos por EAP

Cada lançamento possui serviço, data, categoria, descrição e valor em centavos. Custo lançado não altera quantidade executada.

Orçamento = soma de quantidade × preço unitário dos serviços. Saldo = orçamento menos custos lançados. Grupos consolidam suas folhas uma única vez. Orçamento e preços são fixos no exemplo; custo acima do orçamento produz saldo negativo visível.

Ainda não há compromissos de compra, pagamentos, impostos, reajustes, projeção final ou lucro. Nem edição do orçamento ou estorno de custos.

## Persistência da demonstração

A chave `obra-clara.demo.v1` guarda apenas novos registros no localStorage. A recarga reconstrói o exemplo e valida os registros salvos. Dados inválidos geram aviso e bloqueiam novas gravações sem apagar o conteúdo.

A aplicação usa Web Locks quando disponíveis para coordenar abas do mesmo navegador e relê o armazenamento antes de gravar. Outras abas recebem atualização pelo evento de armazenamento. Isso não equivale a concorrência transacional entre usuários no servidor.

Limpar o armazenamento elimina os novos lançamentos. O usuário pode testar o mesmo endereço sem configurar credenciais, mas não deve usar essa demonstração como registro oficial de uma obra.

## Empresas e acesso

A migração inicial contém `companies`, `company_memberships`, políticas RLS e `create_company`. A criação valida identidade, cria a empresa e o primeiro administrador na mesma transação e aceita repetição segura da solicitação.

Consultas são restritas a vínculos ativos. O cliente autenticado não recebe permissão para inserir ou alterar vínculos diretamente. A função privilegiada fica em esquema privado; a função pública usa os privilégios do chamador para invocá-la.

O código Next.js prepara cadastro/entrada por e-mail, confirmação, renovação de sessão, saída e listagem de empresas. O fluxo em `/app` termina na empresa; obras reais ainda não estão conectadas ao banco.

**Pendente:** organização escolhida pelo responsável, projeto dedicado, migração no ambiente real, configuração de Auth, testes de sessão e e-mail, convites/gestão de membros, autorização por obra, persistência compartilhada e backup. Nenhuma infraestrutura de outro negócio foi reutilizada.

## Verificação realizada

- TypeScript: sem erros.
- Seis testes de domínio, incluindo a curva física: base ponderada e por ambiente, custo independente do avanço, validações, repetição/recuperação local e simulação sem mutação.
- Migração executada em PostgreSQL via PGlite: criação de duas empresas, isolamento de leitura, escrita direta negada, anônimo negado, revogação e repetição segura.
- Compilação de produção Next.js: concluída.
- Navegador: execução de 15 m² de piso na cozinha, resultado de 50% no ambiente e 54,5% na obra; custo de R$ 850,00 no serviço; ambos preservados após recarga e apresentados no diário/EAP.
- Revisão visual em desktop e largura de celular de 360 px.

O teste PGlite usa uma função de identidade controlada e não testa JWT, envio de e-mails, cookies reais do Supabase, carga ou backup. Não foi feita validação de 5.000 usuários simultâneos. As evidências não concluem os critérios do piloto em nuvem.

## Ambiente desta máquina

Repositório: `G:\My Drive\18 - INVOICES\Construction_management`.

A instalação em Google Drive apresentou erros de escrita. A execução foi preparada em uma cópia local dos fontes dentro do diretório de visualizações do Codex, com dependências instaladas em disco local. O repositório conserva todos os fontes; essa cópia é apenas o ambiente de execução, sem outro repositório Git.

Prévia desta sessão: [http://127.0.0.1:4180/demo](http://127.0.0.1:4180/demo). Ela depende do processo local ativo. Para retomar em outro local, usar as instruções do README.

## Sequência de infraestrutura (dependente da organização própria)

1. Fechar com o responsável o fluxo de cadastro e edição da EAP, quantidades, preços e vínculo à planta.
2. Receber a organização do Supabase e revisar custo antes de criar o projeto.
3. Validar Auth/empresas no ambiente dedicado e completar gestão de membros.
4. Implementar obras, EAP e registros no banco, com autorização e transações; nunca apenas copiar localStorage para uma empresa.
5. Acrescentar correções rastreáveis e testar concorrência e restauração.
6. Importar PDF e associar ambientes, preservando versões.

## Curva física na EAP

A tela EAP e custos inclui a curva diária de avanço físico planejado versus realizado. O planejado usa a simulação linear vigente e os pesos da EAP; o realizado acumula medições até cada data e termina em hoje. Um controle de data permite consultar valores e desvio em pontos percentuais. Registros retroativos atualizam a série a partir da data de execução. A distribuição aprovada e a integração com o motor do planejamento US continuam pendentes.

## Previsão do tempo — Alpine, Utah

O topo do Cronograma consulta a previsão real de sete dias do National Weather Service (NWS/NOAA) para 40.4533, -111.7780, no fuso America/Denver. A localização foi escolhida pelo responsável; não vem da localização fictícia do desenho da obra.

A interface mostra condições, máxima diurna, mínima noturna, maior probabilidade de precipitação dos períodos disponíveis e maior vento previsto em mph. Temperatura alterna entre Fahrenheit e Celsius. Não apresenta acumulados de chuva/neve; a probabilidade inclui precipitação em geral. Dias e períodos sem dados ficam indisponíveis.

Atualiza ao abrir Cronograma, ao voltar à aba e a cada 30 minutos enquanto visível. O servidor compartilha a consulta em andamento e mantém cache por 30 minutos nesta instância; produção com várias instâncias deve adotar cache compartilhado. Falhas mostram aviso e preservam a última consulta durante a sessão. Emissão com mais de 24 horas é sinalizada; previsão não muda o cronograma automaticamente.

Endpoint local: /api/weather. Sem chave ou serviço pago contratado. Fonte e documentação: https://www.weather.gov/documentation/services-web-api. Testados dados reais no navegador, sete cartões, conversão °F/°C, largura de 360 px e tratamento de datas/nulls no teste de normalização. Os sete testes e a compilação passaram.

## Visão do cliente

Criada a prévia /cliente/demo, acessível pelo atalho Visão do cliente. Exibe avanço físico, entrega planejada (sem recálculo automático), etapas, planta interativa e últimas cinco execuções. Por decisão do responsável, não apresenta orçamento ou custos. Observações internas do diário não são exibidas; atualizações mostram apenas serviço, ambiente, quantidade e data.

A página não possui formulários de edição. Compartilha apenas os dados demonstrativos no mesmo navegador/origem e reage a atualizações de outras abas. Não é um portal privado: autenticação do cliente, autorização por obra, publicação de atualizações e separação dos dados no servidor permanecem pendentes. Não compartilhar esta rota como acesso real de clientes; o código e o armazenamento continuam sendo de demonstração.

Verificados compilação, ausência de valores financeiros/formulários na interface, seleção de camadas da planta, atalho no painel e layout de 360 px sem excesso de largura.

## Planejamento residencial editável

Adicionada a área /planejamento/demo, com 50 atividades de exemplo em 12 fases e oito recursos iniciais, dependências e recálculo do prazo. Materiais, contratações, equipes e máquinas podem ser adicionados e editados no rascunho. Detalhes, limites e evidências em [Planejamento residencial](planejamento-residencial.md). Publicação na obra e persistência compartilhada continuam pendentes.

## Persistência por módulo e evidências atuais

| Módulo | Armazenamento | Integração atual |
| --- | --- | --- |
| Obra original | localStorage: obra-clara.demo.v1 | Compartilhado com /cliente/demo no mesmo navegador |
| Planejamento US | localStorage: obra-clara.planning.us.v1 | Datas lidas pela simulação da cozinha; fases usadas nas compras |
| Planejamento antigo | localStorage: obra-clara.planning.v1 | Preservado, sem conversão automática |
| Compras e anexos | IndexedDB: obra-clara.material-purchases.v1, store purchases | Lote Excel gravado em transação; rechecagem de duplicados |
| Cozinha | localStorage: obra-clara.primrose-kitchen.v1 | Eventos independentes da EAP e das medições da obra |

Limpar dados do navegador remove registros/anexos locais. Trocar endereço ou porta muda a origem e o armazenamento acessível.

A última execução de npm test passou com 14 testes; build passou. Verificações no navegador cobriram Gantt, inserção, compras/anexos após recarga, prévia Excel sem gravação, confirmação e reimportação, simulação da cozinha sem escrita e execução persistente. Verificados layouts móveis. Contagens menores citadas nas seções anteriores são evidências históricas, não o total atual. Não houve novo teste de código nesta atualização documental.

Biblioteca ExcelJS: auditoria identificou aviso moderado na dependência transitiva uuid, documentado para revisão antes de produção. O arquivo foi validado por leitura programática e no fluxo do portal; não foi aberto no aplicativo nativo Microsoft Excel.


## Preparação financeira — 04/10/2026

Decisão: gestão financeira da obra com integração contábil externa. Aplicados número de fatura, vencimento, impostos incluídos no total e valor pago por item, todos opcionais. Recebido não implica pago; valores ausentes permanecem não informados. Os comprovantes existentes são preservados. Sem exportação contábil, API ou pagamentos reais nesta entrega. O Excel atual permanece com nove colunas; complementar dados no editor. Detalhes, limites e sequência em [Integrações contábeis](integracoes-contabeis.md). Prioridade do núcleo permanece planejamento → aprovação/publicação → execução.


### Correção de composição do valor — 04/10/2026

O formulário agora exige valor unitário e calcula total = quantidade × valor unitário + impostos em USD + shipping em USD. Subtotal é arredondado em centavos (Decimal, half-up) antes de somar acréscimos. Total não é editável. Frete e impostos pertencem ao item; não repetir valores de uma fatura inteira em cada linha. Novos campos unitCostCents e shippingCents são opcionais no contrato para preservar registros antigos. Ao editar um registro sem unitário, o formulário mostra o total anterior e exige informar a composição antes de salvar; não deduz um preço silenciosamente. Excel de nove colunas permanece importando total informado, sem conversão automática. 17 testes e build aprovados.


### Sales tax percentual — 04/10/2026

Editor permite valor manual da fatura ou cálculo percentual informado pelo usuário (0–100%, até quatro casas decimais). Sem consulta automática a IRS/estado e sem alíquota regional predefinida. Imposto = subtotal arredondado em centavos mais shipping se explicitamente incluído, multiplicado pela alíquota; arredondamento half-up. Modo, percentual e opção do shipping são preservados por item. Valor manual continua disponível para registrar a fatura. Regras de tributação, isenções e vigência automática não são determinadas pelo portal. 18 testes e build aprovados; o Excel segue inalterado.


## Retirada de materiais — 04/10/2026

Rota /materiais/retiradas, acessível de Materiais e compras. Registra compra de origem, material/unidade, quantidade, data, responsável, fase/local de destino e observação. Saldo por compra = quantidade recebida integral menos retiradas. Só compras recebidas são elegíveis. Quantidade positiva com até três casas decimais, saldo suficiente e data não futura (Utah). Saída e rechecagem do saldo ocorrem em transação IndexedDB; não há integração de execução/custo/pagamento.

Banco obra-clara.material-purchases.v1 atualizado para versão 2 com store withdrawals, preservando purchases e anexos. Edição de compra com saídas bloqueia mudança de nome/unidade/situação e redução abaixo do retirado. Registros imutáveis nesta interface, sem estorno/devolução ou recebimento parcial ainda. Sem autenticação do responsável, compartilhamento ou estoque em produção. 20 testes e build aprovados; retirada local e persistência verificadas no navegador.


## Checkpoint para pausa — 04/10/2026

Consolidação em [Retomada](retomada.md). Última seleção de destinos compartilha os sete locais padrão US e inclui locais de compras/retiradas, sem misturar a planta fictícia antiga. 20 testes e typecheck reexecutados com sucesso. O GitHub guarda fontes e template, não os registros/anexos do navegador.
