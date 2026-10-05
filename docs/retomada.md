# Ponto de retomada — 04/10/2026

Pausa solicitada pelo responsável. Este checkpoint reúne os fontes e a documentação no repositório Girotto-12/Construction_management.

## Estado entregue

- Demonstração da obra com EAP, medições, custos, curva física e clima Alpine UT.
- Planejamento US com 50 atividades, 12 fases, Gantt e inserção abaixo da atividade.
- Compras com comprovantes, importação Excel revisável e prevenção de duplicados.
- Total automático: quantidade × preço unitário + impostos + shipping. Imposto manual ou percentual informado; opção explícita de tributar shipping. Sem consulta fiscal automática.
- Número da fatura, vencimento e valor pago por item. Recebimento e pagamento separados.
- Retiradas com saldo transacional, responsável, data, fase/local e histórico. Local de destino oferece os sete destinos padrão do modelo US mais locais usados nas compras/retiradas, sem duplicados. Ainda não é cadastro completo de ambientes reais por obra.
- Piloto esquemático da cozinha Primrose, execução registrada separada da simulação, e prévia do cliente sem finanças.

## Próximo trabalho prioritário

Concluir planejamento → revisão/aprovação → publicação versionada → execução registrada. Preservar a base aprovada e conectar medições, curva e visão do cliente. Evoluir o 3D depois de conferir medidas e identificar elementos.

Pendências específicas: devolução/estorno de retiradas, recebimentos parciais, cadastro central de ambientes, agrupamento de faturas e rateios. Atualizar futuramente o Excel para campos financeiros adicionais; o template atual ainda importa nove colunas com total informado. Exportações contábeis/QuickBooks/NetSuite estão documentadas, não implementadas.

## Ambiente e dados

Repositório em G:/My Drive/18 - INVOICES/Construction_management. Execução local no espelho obra-clara-runtime dentro da pasta de visualizações desta conversa, devido a falhas de instalação no Google Drive. Rodar npm ci, npm run build e npm run start em disco local; rotas documentadas no README. A prévia de sessão usa porta 4180 e depende do processo ativo.

Dados inseridos, comprovantes e retiradas vivem no navegador, não no GitHub. Limpar dados ou trocar origem/porta muda sua disponibilidade. Não há backup em nuvem nem compartilhamento de dados reais. O PDF do usuário e screenshots de testes não estão incluídos no repositório.

Projeto exclusivo do responsável, sem infraestrutura da Delta. Organização própria Supabase ainda pendente. Não há publicação de produção. Não criar serviço externo antes de confirmar o destino e o custo já previstos.

## Verificação do checkpoint

20 testes e typecheck aprovados nesta revisão; último build aprovado. Testes de navegador anteriores cobrem persistência, importação, retiradas e seleção de destinos. Esses testes não comprovam carga, autenticação real, backup ou validação fiscal. Ver avisos da dependência ExcelJS/uuid no estado da implementação.
