# Gestão financeira e integrações contábeis

Decisão confirmada pelo responsável em 04/10/2026: desenvolver gestão financeira da obra e integrar com sistemas contábeis, sem construir contabilidade completa nesta fase. Projeto próprio, independente da Delta.

## Fronteira do produto

Obra Clara: orçamento/custos por EAP, compras, compromissos, comprovantes, aprovação de despesas e distribuição por obra. QuickBooks Online, NetSuite ou outro sistema: escrituração, conciliação, fechamento, rotinas fiscais e folha. Esses recursos financeiros são direção de produto, não funcionalidades integralmente entregues.

## Aplicado nesta iteração

Compra local possui ID estável e agora aceita número da fatura, vencimento, impostos incluídos no total e valor já pago do item. Situação de pagamento é derivada: não informado, não pago, parcialmente pago ou pago; total e pago iguais a zero aparecem como sem valor a pagar. Recebimento não implica pagamento e pagamento não implica recebimento. Os impostos não são acrescentados novamente ao total. Valores fora de zero até total são rejeitados; pagamento positivo exige compra efetuada. Datas inválidas são rejeitadas.

Campos opcionais preservam registros existentes e anexos sem migração destrutiva. Ausência de imposto/pagamento não é convertida em zero. Valores pagos são informados manualmente e não comprovam transação bancária. Não há razão contábil, execução de pagamento, estorno financeiro ou trilha de revisão desses campos nesta versão. Armazenamento continua local em IndexedDB.

O template Excel de nove colunas permanece compatível. Não contém os novos campos: completar no editor após importar. Ainda não foi entregue arquivo de exportação contábil nem API conectada.

## Próximas entregas

1. Definir fornecedores com IDs e entidade de fatura (cabeçalho + itens). Uma fatura pode conter vários materiais e ser rateada entre obras/fases. Não duplicar seu valor integral em cada item.
2. Separar pedido, recebimento, fatura, pagamento e aprovação. Adotar registros de pagamentos parciais, ajustes/estornos e autoria. Reconciliar subtotal, impostos, frete, descontos e total; políticas contábeis definidas com o contador.
3. Mapear obra/EAP para contas/categorias/projetos do destino por empresa. Não presumir que fase da obra é conta contábil.
4. Entregar exportação de conferência CSV/Excel e pacote de comprovantes, com lote identificado, revisão, totais e relatório de erros. Implementar formatos específicos depois de validar sistema/versão e tipos de transação suportados.
5. Criar conector QuickBooks Online se utilizado pelos primeiros clientes; NetSuite conforme demanda. Testar em ambiente apropriado antes de dados reais.

## Regras de integração futura

Definir qual sistema é a fonte de verdade para cada entidade/campo. Persistir empresa de destino, IDs internos/externos, lote, versão do payload, resultado e horário. Reenvio não pode duplicar documento; falhas devem ser recuperáveis e alterações após envio precisam de revisão. Exportar não significa importar com sucesso, e envio não significa pagamento. Não sobrescrever uma classificação do contador automaticamente. Anexos e credenciais exigem autorização, isolamento e retenção em ambiente de produção.

A detecção atual de linhas idênticas na importação de materiais não equivale à idempotência contábil nem à identificação de uma fatura. Não usar o número da fatura sozinho como identificador global.

## Sequência e validação

A prioridade geral permanece planejamento → aprovação/publicação → execução registrada. A preparação dos dados financeiros evita retrabalho; não abre uma frente de contabilidade completa. Nesta iteração, testes cobrem independência do recebimento/pagamento, dados antigos sem informação, pagamento parcial, limites e vencimento inválido.

## Referências consultadas

- Intuit, bills e fornecedores: https://developer.intuit.com/app/developer/qbo/docs/develop/basic-implementations/basic-billing-implementation
- Oracle, importação de vendor bills: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N427250.html
- Oracle, integrações: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1529089601.html


### Correção de composição do valor — 04/10/2026

O formulário agora exige valor unitário e calcula total = quantidade × valor unitário + impostos em USD + shipping em USD. Subtotal é arredondado em centavos (Decimal, half-up) antes de somar acréscimos. Total não é editável. Frete e impostos pertencem ao item; não repetir valores de uma fatura inteira em cada linha. Novos campos unitCostCents e shippingCents são opcionais no contrato para preservar registros antigos. Ao editar um registro sem unitário, o formulário mostra o total anterior e exige informar a composição antes de salvar; não deduz um preço silenciosamente. Excel de nove colunas permanece importando total informado, sem conversão automática. 17 testes e build aprovados.


### Sales tax percentual — 04/10/2026

Editor permite valor manual da fatura ou cálculo percentual informado pelo usuário (0–100%, até quatro casas decimais). Sem consulta automática a IRS/estado e sem alíquota regional predefinida. Imposto = subtotal arredondado em centavos mais shipping se explicitamente incluído, multiplicado pela alíquota; arredondamento half-up. Modo, percentual e opção do shipping são preservados por item. Valor manual continua disponível para registrar a fatura. Regras de tributação, isenções e vigência automática não são determinadas pelo portal. 18 testes e build aprovados; o Excel segue inalterado.
