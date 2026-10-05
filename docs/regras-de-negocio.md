# Regras de negócio

Estado: regras alvo do núcleo e sua expansão; implementação parcial descrita no [estado atual](estado-da-implementacao.md). Decisões de produto estão no [plano](plano-de-implementacao.md).

## RN01 — Empresa e acesso

Todo dado de obra pertence a uma empresa. Identidade autenticada e vínculos ativos determinam acesso; um identificador de empresa enviado pelo cliente não autoriza a operação. Relações entre obra, ambiente, atividade, medição e arquivo devem permanecer na mesma empresa e obra.

Administradores acessam suas empresas; demais membros precisam de permissão na obra. Revogação impede novas operações e mantém autoria histórica. Deve restar pelo menos um administrador ativo na empresa.

## RN02 — Obra e escopo

Obra tem início, entrega prevista não anterior ao início e fuso horário. Ambientes têm nome único na obra, após remover espaços nas pontas e comparar sem distinguir maiúsculas. Cadastros com histórico não são excluídos fisicamente. Arquivar um cadastro preserva seus pesos, denominadores e medições nos cálculos da base; não pode fazer o avanço mudar por exclusão de linhas.

Cada atividade usa um único modo:

- **Por ambiente:** uma parcela de quantidade para cada ambiente aplicável.
- **Global:** uma única parcela “Toda a obra”, sem ambiente associado.

Não misturar parcelas globais e por ambiente na mesma atividade. Execução não pode contar nos dois modos. Atividade global não distribui automaticamente avanço aos ambientes. Combinação ambiente/atividade sem parcela mostra “Não se aplica”, em vez de 0%.

## RN03 — Quantidades, pesos e base aprovada

Cada atividade tem unidade única. Proposta de precisão: m² com duas casas, m³ com três, pontos e etapas inteiros. A precisão pertence ao cadastro da unidade; unidades diferentes não compartilham denominador.

Parcela tem quantidade prevista positiva. O previsto da atividade é a soma das parcelas, sem segundo total editável. Executado deriva das medições, sem campo manual independente.

Pesos são percentuais positivos com até duas casas decimais, somando exatamente 100,00% ao publicar. Não normalizar silenciosamente. Atividades sem contribuição física ficam fora desta base no núcleo; sua representação no cronograma depende de D5.

A base contém atividades, parcelas e pesos. Em rascunho pode ser alterada. Só se aceitam medições com base publicada. No núcleo existe uma única base publicada por obra: unidades, escopos, quantidades e pesos ficam congelados após publicação.

Revisões de escopo exigem a política D4 e evolução explícita do modelo. Excesso de execução não contorna esse limite. Correções de executado continuam possíveis por RN06.

## RN04 — Registro no diário

Exigir atividade/parcela válida, quantidade positiva, data de execução e usuário autorizado. Unidade vem da atividade. Observação opcional tem até 1.000 caracteres; texto é conteúdo, nunca código.

A data deve existir no calendário e ficar entre o início da obra e hoje no fuso da obra, inclusive. Sem execução futura. Horário de gravação é gerado no servidor em UTC. As datas fixas da demonstração não se aplicam ao piloto.

Validar precisão e saldo da parcela. Rejeitar excesso sem arredondar para caber ou truncar silenciosamente. Saldo de outra parcela não libera o registro.

Proposta D3: registro válido afeta avanço imediatamente, sem aprovação intermediária. Obras e parcelas arquivadas não aceitam execução nova.

## RN05 — Persistência, concorrência e repetição

Autorização, saldo e gravação formam operação atômica. Proteger a validação contra gravações concorrentes por transação e bloqueio ou mecanismo equivalente.

Cada solicitação tem chave de idempotência. Na empresa, repetir chave, operação e conteúdo devolve o resultado salvo. Mesma chave com conteúdo diferente produz conflito. Revalidar autorização também na repetição.

Saldo não pode ser negativo e executado líquido não ultrapassa previsto. Falha em qualquer parte cancela tudo. Totais em cache são derivados e reconstruíveis pelo histórico.

## RN06 — Correções

Medições gravadas não são editadas ou apagadas. Gestor/admin estorna informando motivo. O estorno tem mesma parcela, data de execução e magnitude do original, com quantidade negativa e vínculo explícito. Uma execução só pode ser estornada uma vez; não se estorna um estorno.

Substituir quantidade exige estorno e nova medição positiva na mesma transação e solicitação. A substituição pode corrigir data ou parcela dentro da mesma obra, atendendo às regras usuais. Para corrigir uma substituição, corrigir sua medição positiva com nova solicitação.

Revalidar saldos e acumulados por data das parcelas afetadas desde a data mais antiga alterada. Nenhuma data pode ficar abaixo de zero ou acima do previsto. Original e estorno na mesma data são avaliados pelo efeito líquido, sem saldo intermediário artificial.

Estorno conserva a data de execução original e recebe horário de gravação atual. Assim, corrige a série histórica; a auditoria mostra quando foi corrigida. A primeira versão apresenta a história corrigida com o conhecimento atual, sem reconstruir “o que se sabia naquele dia”.

Obra arquivada rejeita correções. Administrador pode reabri-la com auditoria e então corrigir. Estornar uma execução em parcela preservada não exige apagar ou recriar essa parcela.

## RN07 — Avanço físico

Para a parcela j da atividade i:

```text
executado_ij = soma das quantidades assinadas das medições
percentual_ij = 100 × executado_ij / previsto_ij

previsto_i = soma dos previstos das parcelas da atividade i
executado_i = soma dos executados das parcelas da atividade i
percentual_i = 100 × executado_i / previsto_i

avanço_obra = soma(percentual_i × peso_i / 100)
```

Não fazer média simples dos percentuais dos ambientes. Não somar m² e pontos como total físico da obra; pesos convertem atividades em contribuições percentuais.

Calcular com decimal exato e arredondar só na apresentação, com até uma casa decimal em pt-BR. Concluído significa executado igual ao previsto, mesmo que uma razão menor arredonde visualmente para 100%.

- Cozinha com 10 de 20 m² e sala com 0 de 80 m²: cozinha 50%, sala 0%, atividade 10%.
- Na nova EAP, piso da cozinha com 15 de 30 m² e peso de 3%: 50% nesse serviço e contribuição de 1,5 ponto percentual; obra passa de 53% a 54,5%. No protótipo original, o peso era 15%, gerando 60,5%.

Sem base publicada, mostrar “Planejamento pendente”. Com base publicada e sem medições, 0%. Não há percentual único do ambiente combinando unidades diferentes no núcleo; mostrar avanço por atividade.

## RN08 — Planejado e curva S

Em E4, planejado vem de distribuição aprovada de quantidades por parcela e data. A soma por parcela deve coincidir com seu previsto. Usar pesos e denominadores iguais aos do realizado.

Realizado na data d usa medições até d, com efeitos líquidos de correções. Planejado na data d usa quantidades planejadas até d. Séries identificam a base; revisões dependem de D4.

Desvio = realizado menos planejado, em pontos percentuais. Sem distribuição aprovada, planejado e desvio ficam indisponíveis, não em zero. Projeções futuras são previsões, separadas do histórico executado.

Os 58% planejados e as datas da demonstração não são padrões para novas obras. Prazo até entrega usa a data prevista e o fuso da obra; indicar atraso quando vencida, sem conservar os 77 dias fixos da interface.

## RN09 — Planta PDF

Em E5, PDF pertence à obra e tem versão. Marcação pertence à página de uma versão e referencia ambiente da mesma obra. Geometria serve à visualização; não gera quantitativos automaticamente.

Avanço vem das parcelas e medições. Preservar versões antigas e exigir associação explícita das marcações à nova versão. Acesso ao arquivo respeita autorização da obra.

## RN10 — Cronograma e recursos

Em E6, dependências formam grafo sem ciclos. Proposta inicial: término–início, durações em dias úteis e calendário da obra. Granularidade por ambiente, outros vínculos e defasagens dependem de D5. Nova previsão não modifica a base de avanço físico automaticamente.

Em E7, alocações indicam obra, atividade/parcela, data e capacidade necessária. Verificar capacidade entre obras que compartilham recurso na empresa. Planejar trabalho não cria medição; necessidade de material não movimenta estoque. Bloqueio versus alerta de conflito depende de D6.

## RN11 — Custos por EAP

A EAP agrupa serviços em uma hierarquia sem ciclos. Grupos consolidam seus serviços descendentes; não recebem lançamentos diretos nem duplicam valores das folhas. Cada custo referencia exatamente um serviço/escopo da mesma obra.

Obra possui moeda única. Orçamento de cada serviço = quantidade prevista × preço unitário; arredondar o resultado monetário para centavos. Armazenar e somar custos em centavos inteiros e apresentá-los com duas casas. Quantidades conservam a precisão da unidade, separada do arredondamento visual de percentuais.

Lançamento exige data entre início e hoje no fuso da obra, categoria (material, mão de obra, equipamento ou outros), descrição de até 300 caracteres e valor positivo. Na demonstração, o limite de valor por lançamento é R$ 1 bilhão; o piloto deve validar limites de negócio e permissões em D10.

Custo lançado não implica pagamento, execução física nem compromisso de compra. Saldo = orçamento menos custos lançados; saldo negativo é permitido e destacado. Não apresentar esse saldo como lucro ou previsão de custo final.

Aplicar autorização, idempotência e gravação transacional no servidor. Correções futuras exigem estorno com motivo e autoria, sem reescrever o original. O fluxo atual local somente adiciona custos; orçamento editável, estornos e revisões permanecem pendentes.


## Regras dos novos protótipos locais — 04/10/2026

- Inserir abaixo mantém ordem e fase, sem criar predecessora automaticamente.
- Compras mantêm valores em centavos USD e um comprovante por item. Trocar o arquivo substitui o anexo local; não há versionamento de comprovantes. Cadastro/alteração não gera custo, pagamento, estoque ou medição.
- Excel aceita aba Materials, nove cabeçalhos fixos, até 500 linhas e 2 MB. Campos numéricos precisam ser números, não fórmulas/texto; data deve ser válida e fase deve existir no plano. Erros bloqueiam o lote completo. Itens idênticos são ignorados, inclusive na transação final. Importação não atualiza itens existentes e não inclui anexos.
- Na cozinha, uma camada planejada aparece após o término da atividade vinculada. Não existe interpolação da execução: elementos reais aparecem somente por confirmação manual, com evento de desfazer preservado. A contagem dos sete elementos não é o percentual físico da obra.
- Alterar modo, data ou transparência não registra execução. Os eventos da cozinha ainda não alimentam a EAP nem o portal do cliente.


## Preparação financeira — 04/10/2026

Decisão: gestão financeira da obra com integração contábil externa. Aplicados número de fatura, vencimento, impostos incluídos no total e valor pago por item, todos opcionais. Recebido não implica pago; valores ausentes permanecem não informados. Os comprovantes existentes são preservados. Sem exportação contábil, API ou pagamentos reais nesta entrega. O Excel atual permanece com nove colunas; complementar dados no editor. Detalhes, limites e sequência em [Integrações contábeis](integracoes-contabeis.md). Prioridade do núcleo permanece planejamento → aprovação/publicação → execução.


### Correção de composição do valor — 04/10/2026

O formulário agora exige valor unitário e calcula total = quantidade × valor unitário + impostos em USD + shipping em USD. Subtotal é arredondado em centavos (Decimal, half-up) antes de somar acréscimos. Total não é editável. Frete e impostos pertencem ao item; não repetir valores de uma fatura inteira em cada linha. Novos campos unitCostCents e shippingCents são opcionais no contrato para preservar registros antigos. Ao editar um registro sem unitário, o formulário mostra o total anterior e exige informar a composição antes de salvar; não deduz um preço silenciosamente. Excel de nove colunas permanece importando total informado, sem conversão automática. 17 testes e build aprovados.


## Retirada de materiais — 04/10/2026

Rota /materiais/retiradas, acessível de Materiais e compras. Registra compra de origem, material/unidade, quantidade, data, responsável, fase/local de destino e observação. Saldo por compra = quantidade recebida integral menos retiradas. Só compras recebidas são elegíveis. Quantidade positiva com até três casas decimais, saldo suficiente e data não futura (Utah). Saída e rechecagem do saldo ocorrem em transação IndexedDB; não há integração de execução/custo/pagamento.

Banco obra-clara.material-purchases.v1 atualizado para versão 2 com store withdrawals, preservando purchases e anexos. Edição de compra com saídas bloqueia mudança de nome/unidade/situação e redução abaixo do retirado. Registros imutáveis nesta interface, sem estorno/devolução ou recebimento parcial ainda. Sem autenticação do responsável, compartilhamento ou estoque em produção. 20 testes e build aprovados; retirada local e persistência verificadas no navegador.
