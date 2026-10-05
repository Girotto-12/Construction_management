# Obra Clara

Gestão de obras residenciais com planta visual, execução por ambiente e custos ligados à Estrutura Analítica do Projeto (EAP).

A primeira implementação em **Next.js + TypeScript** está disponível como demonstração interativa. O código de autenticação e empresas foi preparado para **Supabase**; **Vercel** é a hospedagem escolhida. A organização do Supabase será indicada pelo responsável depois. Nenhum serviço foi criado ou publicado nesta etapa.

## Direção e retomada

Mercado inicial: Estados Unidos. Inglês americano, USD e unidades imperiais; migração da interface e da demonstração original ainda parcial. Projeto exclusivo do responsável, sem recursos da Delta. Prioridade: concluir planejamento → aprovação/publicação → execução, antes de ampliar o modelo visual. Consulte [documentação consolidada](docs/README.md).

Rotas: /demo, /planejamento/demo, /materiais/demo, /modelo/demo e /cliente/demo. Todos os módulos ainda são demonstrações locais; suas bases não estão integralmente conectadas.

## Executar

Use Node.js 24 e npm. Prefira um diretório em disco local: nesta máquina, o Google Drive apresentou erros de escrita ao instalar dependências.

```sh
npm ci
npm run dev
```

Abra [http://127.0.0.1:3000/demo](http://127.0.0.1:3000/demo).

Para conferir a compilação de produção:

```sh
npm run build
npm run start
```

A demonstração funciona sem credenciais. Os novos registros ficam no armazenamento deste navegador, nesta origem (endereço e porta). Não há sincronização entre dispositivos. Limpar os dados do navegador remove esses registros.

## O que já funciona na demonstração

- Planejamento US: 50 atividades em 12 fases, oito recursos, dependências, Gantt, fases expansíveis e inserção abaixo da linha.
- Compras por fase/local, comprovantes por item e importação Excel com prévia, validações e prevenção de duplicados.
- Piloto visual da cozinha Primrose com camadas, simulação e registros locais separados da EAP.
- Planta de exemplo com alvenaria, elétrica e pisos por ambiente.
- Registro de quantidades que atualiza a planta, o diário e o avanço físico.
- Consulta do executado por data e simulação linear do planejamento.
- Previsão real de sete dias para Alpine, Utah, no Cronograma, com atualização automática e temperaturas em °F/°C.
- EAP com orçamento, custos lançados e saldo por serviço, etapa e obra.
- Curva física planejada × realizada, com consulta por data e desvio em pontos percentuais.
- Lançamento de custos de materiais, mão de obra, equipamentos e outros.
- Preservação dos registros após recarregar, validação de saldo e prevenção de repetição da mesma solicitação.
- Interface adaptada para desktop e celular.

### Experimente

1. Abra **Obra ao vivo**, selecione **Pisos** e clique na **Cozinha**.
2. Em **Registrar neste ambiente**, informe **15 m²** e salve.
3. A cozinha passa a **50%** em pisos. O avanço geral passa de **53% a 54,5%**, pois esse serviço tem peso de 3% na obra.
4. Lance um custo de **R$ 850,00** nesse serviço e confira **EAP e custos** e **Diário de obra**.
5. Recarregue: os registros permanecem. Navegar na simulação não cria execução.

Esse cenário parte de uma demonstração sem novos lançamentos. Os dados são fictícios.

## Supabase — base preparada

A aplicação contém entrada/cadastro por e-mail, renovação da sessão, listagem das empresas permitidas e criação atômica da empresa com o primeiro administrador. A migração inicial cria empresas e vínculos com políticas de acesso (RLS).

A integração ainda não foi validada ponta a ponta em um projeto Supabase. Por enquanto, `/entrar` informa que o espaço da empresa está em preparação.

Depois de definir a organização e revisar o custo do projeto:

1. Criar um projeto dedicado e aplicar a migração em `supabase/migrations/` ao destino conferido.
2. Copiar `.env.example` para `.env.local` e preencher URL, chave publicável e endereço da aplicação.
3. Configurar no Auth o endereço da aplicação e o redirecionamento `/auth/confirmar`.
4. Validar cadastro, confirmação, entrada, saída e duas empresas isoladas no ambiente real.

Use somente a chave publicável no cliente. Gestão de membros, obras, EAP e medições no banco ainda precisam ser implementadas; conectar o Supabase não transforma automaticamente a demonstração em dados reais.

## Verificar

```sh
npm run typecheck
npm test
npm run test:database
npm run build
```

Os testes de domínio verificam cálculos, saldo, datas, precisão, repetição e recuperação dos registros locais. O teste de banco executa a migração em PostgreSQL local via PGlite e verifica isolamento entre empresas, proibição de escrita direta e revogação. Ele usa uma identidade de teste e não substitui o teste do Auth do Supabase.

## Limites e próximos passos

A planta é um SVG de exemplo; importar um PDF e marcar seus ambientes é uma próxima entrega. A simulação do planejamento distribui quantidades linearmente entre datas; dependências e reprogramação automática ainda não funcionam.

O orçamento é fixo no exemplo. Lançamentos representam custos informados, sem compras, contas a pagar, estoque ou projeção de lucro. Correções por estorno, autoria autenticada dos registros, backups e persistência compartilhada da obra ainda estão pendentes.

Consulte o [estado da implementação](docs/estado-da-implementacao.md) e o [plano de continuidade](docs/plano-de-implementacao.md).

## Estrutura

- `src/app/`: rotas Next.js, autenticação e estilos.
- `src/components/`: planta, EAP, cronograma, diário e formulários.
- `src/lib/`: cálculos, dados de exemplo, persistência local e cliente Supabase.
- `supabase/migrations/`: esquema inicial e autorização de empresas.
- `tests/`: verificações de domínio e banco.
- `docs/`: requisitos, regras e plano.
- `dist/`, `serve.cjs` e `verify.cjs`: protótipo original preservado.

## Protótipo original

```sh
node serve.cjs
npm run verify:legacy
```

Abre na porta 4173. Esse protótipo usa registros em memória e o cenário antigo de pisos (peso de 15%, resultado de 60,5% na obra); ele não compartilha dados com a aplicação nova.
