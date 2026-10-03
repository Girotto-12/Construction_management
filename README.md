# Obra Clara

Protótipo navegável de gerenciamento de obras residenciais, desenvolvido como ponto de partida para um produto SaaS destinado a construtoras.

## Telas

- Visão geral: indicadores e curva S de avanço planejado versus realizado.
- Cronograma: Gantt ilustrativo, dependências e pesos das etapas.
- Planejamento semanal: atividades, mão de obra, equipamentos e materiais.
- Planta e avanço: visualização por ambiente e por etapa da construção.
- Diário de obra: registro de quantidades executadas e observações.

## Executar localmente

Requer Node.js. Não há dependências externas para instalar.

```sh
node serve.cjs
```

Abra http://127.0.0.1:4173 no navegador.

## Verificar

```sh
node --check dist/app.js
node verify.cjs
```

A verificação cobre as cinco telas, cálculo ponderado do avanço, registro de pisos, validação de saldo e ambiente e escape de texto.

## Exemplo de uso

No Diário de obra, escolha Revestimentos e pisos, informe 15 m² para a Cozinha e salve. A atividade passa a 50% e o avanço geral passa de 53% para 60,5%. Confira o resultado no painel e na camada de pisos da planta.

## Limites atuais

Os dados e a planta são demonstrativos. Os registros ficam em memória e são perdidos ao atualizar ou fechar a página. O valor atual de avanço é calculado pelos apontamentos; o histórico e a projeção da curva S são ilustrativos.

O cronograma ainda não recalcula dependências automaticamente. Recursos e calendário são exemplos. A associação de alvenaria e elétrica por ambiente é simplificada e precisa de quantidades próprias por ambiente na versão piloto.

Ainda não há autenticação, separação de dados por empresa, banco de dados, upload de fotos, importação de PDF/DWG/DXF ou assinaturas.

## Estrutura

- `dist/index.html`: estrutura do aplicativo.
- `dist/style.css`: estilos e adaptação a celular.
- `dist/app.js`: navegação, dados demonstrativos e interações.
- `serve.cjs`: servidor local de prévia.
- `verify.cjs`: verificação funcional básica.

## Próximas etapas

Persistência e contas de empresas; cadastro de obras e ambientes; importação de plantas PDF; quantidades por atividade e ambiente; motor de cronograma; alocação real de recursos; histórico de medições para a curva S.
