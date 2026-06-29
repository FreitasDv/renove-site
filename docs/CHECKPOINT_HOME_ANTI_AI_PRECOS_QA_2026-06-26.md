# Checkpoint Home Anti-IA + Preços + QA - 2026-06-26

## Fonte de verdade do lote

Feedback do João em 26/06/2026:

- Home ainda estava com cara de IA/amadora.
- Cards flutuantes e blocos brancos pareciam gratuitos e ruins.
- Seções centralizadas deixavam vazio lateral, especialmente em desktop/ultrawide.
- Folhas/botânica deveriam virar assinatura visual, não detalhe tímido.
- Preços e escada comercial não deveriam aparecer publicamente no site sem validação com o cliente.
- A parte "A diferença da Renove" tinha desalinhamento conceitual e visual.

## Skills/disciplina usadas

- Superpowers: leitura de `using-superpowers`, `writing-plans`, `verification-before-completion` e `brainstorming` como disciplina de escopo/validação.
- Front/design: `joao-frontend-visual-forge`, `joao-ui-ux-audit-pack`, `avoid-ai-design`, `ui-craft`, `design-taste-frontend`, `frontend-design`, `web-designer`, `joao-human-copy-editor`.
- Multi-agents: 3 explorers read-only para auditoria visual, auditoria de preços/schema e anatomia CSS/layout.

## Fato verificado

- A Home atual não tinha mais valores nominais, mas ainda tinha `priceRange: "$$"` no schema e linguagem de investimento no miolo.
- A página `/emagrecimento-bauru/` ainda expunha valores, nomes de planos e parcelas em HTML visível e JSON-LD.
- O QA exigia `R$2.797`, reforçando a volta do erro.
- A Home repetia a cadência `4 cards -> 4 números -> 4 passos -> 4 pilares`, gerando aparência genérica.
- Havia conflito de prova: `3 anos` em uma seção e `+7 anos` em outra.
- A folha do bloco "A diferença" estava sendo empurrada como elemento relativo por uma regra de camada, criando vazio visual no topo.

## Alterações executadas

- Home:
  - removeu `priceRange` do schema.
  - trocou o número conflitante `3 anos` por prova de equipe.
  - removeu copy de "quanto custa logo na primeira conversa" do bloco de clareza.
  - transformou `+7 anos / Médica + Nutri / Plano individual / Bioimpedância` em pilares de método: avaliação integrada, plano individual, medição objetiva e ajuste de rota.
  - aplicou grid assimétrico na `decision-rail` em desktop.
  - compactou a `decision-rail` no mobile para reduzir caixinhas.
  - reforçou assinatura botânica em `care-section` e `proof-section`.
  - corrigiu a regra de camada para `.page-home .proof-section > *:not(.botanical)`, impedindo a folha de ocupar espaço invisível.
  - ajustou serviços para composição mais assimétrica e menos marketplace de cards.

- Página `/emagrecimento-bauru/`:
  - removeu valores nominais do FAQ schema.
  - removeu `price` e `priceCurrency` do `Offer`.
  - removeu `Start`, `Bronze`, `Prata`, `Gold`, `Premium`, parcelas e valores da escada pública.
  - substituiu a seção por "Formato do acompanhamento", sem preço e sem pacote fechado.
  - atualizou FAQ/resumo para investimento explicado na avaliação.

- QA:
  - removeu exigência de `R$2.797`.
  - adicionou bloqueio contra `R$`, `10x`, `price`, `priceCurrency`, `priceRange` e padrões comerciais de escada de planos em HTML/schema público.

## Validação

- `npm run qa:content` passou.
- `npm run qa:a11y` passou: 10 rotas x 3 larguras, sem violação confirmada.
- `npm run qa:visual` passou: 10 rotas x 5 viewports, screenshots atualizados em `qa-artifacts/`.
- Varredura final em HTML público não encontrou valores/preço/schema de preço.

## Próximo micro-lote recomendado

Continuar a melhora visual além da Home:

1. Revisar `/harmonizacao-facial-bauru/`, `/sobre/`, `/contato/` e blog com a mesma régua anti-card/anti-IA.
2. Fazer QA visual manual em ultrawide 1920/2560 além dos 1600 atuais.
3. Criar uma regra de governança no doc do site: preços comerciais só entram em HTML público com decisão explícita do João + cliente.
4. Revisar docs e scripts antigos de benchmark que ainda defendem "preço como filtro", para não reintroduzirem essa tese.
