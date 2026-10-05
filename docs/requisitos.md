# Requisitos da versão piloto

Estado: especificação do piloto, atualizada em 04/10/2026. Parte dos fluxos existe na demonstração local; os critérios de uso real ainda não estão concluídos. Veja o [estado da implementação](estado-da-implementacao.md).

## Escopo

**P0 — núcleo:** operar uma obra com usuários autorizados, planejamento de quantidades, diário persistente e avanço confiável. Inclui orçamento e custos por EAP. Entregas E1 a E3 e E8.

**P1 — expansão:** histórico real, planta PDF, cronograma calculado e alocação de recursos. Entregas E4 a E7, com dependências descritas no plano.

## Perfis propostos

Uma pessoa pode pertencer a mais de uma empresa. A empresa e a obra ativas devem estar visíveis.

| Perfil | Permissões |
| --- | --- |
| Administrador da empresa | Gerenciar membros, criar e arquivar obras e acessar todas as obras da empresa. Pode executar as ações do gestor. |
| Gestor da obra | Gerenciar acesso à obra entre membros ativos da empresa, cadastrar ambientes e atividades, publicar planejamento, registrar execução e corrigir medições. |
| Apontador | Consultar sua obra e registrar execução. Solicita correções ao gestor; não altera planejamento nem registros salvos. |
| Leitor | Consultar as obras às quais recebeu acesso. |

O administrador atribui o primeiro gestor. Gestores não promovem membros a administradores da empresa nem removem o último gestor ativo da obra. Estes perfis dependem da validação D1.

## Jornada principal

1. O usuário entra, escolhe sua empresa e abre uma obra permitida.
2. O administrador cria a obra com datas e fuso horário e atribui um gestor.
3. O gestor cadastra ambientes, atividades, unidades, quantidades por escopo e pesos. Publica a base após validar os totais.
4. O apontador seleciona atividade e escopo, informa data, quantidade e observação. O formulário mostra unidade e saldo.
5. O sistema salva e atualiza saldo, avanço da atividade e avanço da obra.
6. Outro usuário autorizado encontra os mesmos dados. Correções posteriores preservam autoria e motivo.

## Requisitos funcionais

| ID | Prioridade | Requisito | Critério de aceite |
| --- | --- | --- | --- |
| RF01 | P0 | Autenticação e sessão | Apenas usuários autenticados acessam dados da empresa; sair impede novas consultas e gravações protegidas. |
| RF02 | P0 | Empresas, membros e permissões | Usuários de empresas diferentes não consultam nem alteram dados um do outro, inclusive usando identificadores diretamente. Revogar acesso bloqueia a próxima operação protegida. |
| RF03 | P0 | Obras e ambientes | Obra possui nome, datas e fuso. Ambiente pertence a uma obra. Obra arquivada permite consulta e rejeita novos apontamentos. |
| RF04 | P0 | Atividades e base física | Atividade possui unidade e peso. Publicar exige quantidades positivas, escopos válidos e pesos somando 100%. A base publicada é preservada conforme RN03. |
| RF05 | P0 | Diário persistente | Registro permanece após recarga e nova sessão; conserva data da execução, quantidade, observação, autor e horário da gravação. Listagem permite filtrar período, atividade e escopo. |
| RF06 | P0 | Validações e correções | Excesso de saldo, data inválida, escopo incorreto e falta de permissão são rejeitados sem efeitos parciais. Gestor corrige por estorno e eventual substituição, preservando motivo e histórico. |
| RF07 | P0 | Indicadores atuais | Diário, painel e detalhe do ambiente usam os mesmos registros. O cenário novo produz 50% no piso da cozinha e 54,5% na obra (peso de 3% nesse serviço). O protótipo original conserva seu teste independente de 60,5%. |
| RF08 | P1 | Histórico e curva S | Calcular realizado acumulado por data e planejado pela distribuição aprovada; retirar pontos demonstrativos da série real. |
| RF09 | P1 | Planta PDF por versão | Gestor envia PDF, escolhe página e associa áreas a ambientes. Nova versão preserva marcações anteriores. Selecionar área mostra avanço por atividade no ambiente. |
| RF10 | P1 | Cronograma e dependências | Informar calendário, durações e predecessoras; rejeitar ciclos, calcular previsão e mostrar impactos antes de salvar. Preservar referência aprovada. |
| RF12 | P0 | Custos por EAP | Orçamento por serviço e custos datados/categorizados; grupos consolidam folhas uma vez. Centavos preservados; custos não alteram avanço físico; correções preservam histórico. |
| RF11 | P1 | Semana e recursos | Alocar equipes/equipamentos e necessidades de materiais por frente e data; mostrar conflitos e abrir o diário com atividade e escopo selecionados, sem registrar execução automaticamente. |

Em RF07, atividades globais não recebem percentuais fictícios em cada ambiente. Até RF08/RF10, indicadores sem dados reais aparecem como indisponíveis ou explicitamente demonstrativos, nunca como indicadores da obra cadastrada.

## Requisitos de qualidade

| ID | Requisito | Evidência necessária |
| --- | --- | --- |
| RNF01 | Autorização em cada operação | Verificação no serviço/dados, incluindo arquivos; restrição somente na interface não basta. |
| RNF02 | Consistência concorrente | Duas gravações não excedem saldo; repetição da mesma solicitação não duplica execução. |
| RNF03 | Rastreabilidade | Identificar autor, datas e vínculos entre original, estorno e substituição; impedir reescrita do histórico. |
| RNF04 | Uso no canteiro | Registrar pelo celular, navegar por teclado, usar rótulos e mensagens legíveis e não depender só de cor. Verificar o fluxo em largura de 360 px e desktop. |
| RNF05 | Falhas recuperáveis | Manter formulário em erro de rede, explicar estado e permitir repetição segura; só anunciar sucesso após confirmação de persistência. |
| RNF06 | Datas e números | Apresentar em pt-BR, respeitar precisão por unidade e calcular hoje no fuso da obra; auditoria em UTC. |
| RNF07 | Recuperação | Documentar backup e executar restauração em teste antes de usar dados reais. Definir volume e metas de recuperação em D8. |

## Cenários de aceite do núcleo

1. **Persistência e acesso:** cadastrar empresas A e B, obras e usuários distintos. Registrar em A, sair e entrar. O registro permanece; B não o acessa nem por identificador direto.
2. **Referência matemática:** preparar a EAP nova, com pesos somando 100% e medições iniciais de 53%. Registrar 15 de 30 m² no piso da cozinha (peso 3%): ambiente 50%, contribuição adicional de 1,5 ponto e obra 54,5%. O cenário antigo de oito atividades e peso de 15% continua restrito ao teste do protótipo original.
3. **Saldo por ambiente:** alvenaria prevista em 20 m² na cozinha e 80 m² na sala. Executar 10 m² na cozinha: ambiente 50%, atividade 10%, sala 0%.
4. **Concorrência e repetição:** com saldo de 15 m², enviar dois novos registros simultâneos de 10 m². Só um é aceito. Repetir sua mesma chave retorna o resultado salvo, sem novo registro.
5. **Correção:** gestor corrige 15 m² para 12 m². Indicadores consideram 12 m²; original, estorno de 15 m², substituição de 12 m² e motivo continuam consultáveis. Apontador não pode corrigir.
6. **Erro sem mutação:** enviar data impossível, quantidade acima do saldo ou atividade de outra obra. Não aparecem registros parciais e o formulário explica o erro.

7. **Custo e consolidação:** lançar R$ 850,00 no piso da cozinha. O serviço, o grupo Acabamentos e a obra aumentam seus custos em R$ 850,00; avanço físico não muda. Repetir a solicitação não duplica o custo. Correção futura conserva o registro original.

Os testes atuais estão descritos no estado da implementação. Cenários com usuários reais, concorrência no servidor, correções e recuperação de backup continuam pendentes. verify.cjs cobre apenas o protótipo original.


## Escopo confirmado adicional — 04/10/2026

- US primeiro: inglês americano, USD e unidades imperiais; demais países são expansão futura. A demonstração original ainda não foi convertida integralmente.
- Planejamento inspirado nos conceitos do Microsoft Project: EAP/Gantt já demonstrados. Marcos, defasagens, calendários, caminho crítico e baseline seguem pendentes.
- Compras: cadastrar material, fornecedor, quantidade, total, data opcional, fase, local, situação e comprovante. Excel deve oferecer instruções, seleção de fase/status e revisão do lote antes de confirmar. Critério local: erro bloqueia o lote, duplicado idêntico não gera segunda compra e recarga preserva item/anexo.
- Cliente final: avanço, etapas e previsão de entrega, sem dados financeiros. Portal autenticado ainda pendente.
- Visual: piloto de cozinha aceito como começo. Confirmar medidas e trajetos antes de representar geometria fiel; avanço deriva de execução, não de passagem do tempo.

Esses requisitos complementam os identificadores existentes; o estado local não conclui autorização, persistência compartilhada ou aceite em produção.
