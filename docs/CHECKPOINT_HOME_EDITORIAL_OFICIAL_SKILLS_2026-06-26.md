# Checkpoint - Home editorial + skills oficiais - 2026-06-26

## Fonte do pedido

Joao pediu para seguir alem das skills locais criadas, usando tambem skills oficiais/top de frontend, sem ficar preso a um conjunto estreito de regras.

## Skills aplicadas neste micro-lote

- `build-web-apps:frontend-app-builder`: usado como criterio de design de superficie, ritmo de secoes e bar anti-card-grid.
- `build-web-apps:frontend-testing-debugging`: usado como disciplina de validacao renderizada, com screenshot real e gates por viewport.
- `frontend-design`: usado para forcar direcao visual mais autoral e menos template.
- `ui-craft`: usado especialmente nas regras de layout, cor, acessibilidade e anti-slop.
- Skills locais Renove/Joao continuam como contexto, mas nao foram a unica fonte de decisao.

## FATO VERIFICADO

- A home ainda tinha, apos a secao de servicos, uma `care-section` baseada em grade de cards e uma `proof-section` com comparativo cardado.
- Essa anatomia reforcava a sensacao reclamada pelo Joao: blocos repetidos, cards soltos, vazio lateral e layout com cara de IA.
- Os precos continuam bloqueados no QA de conteudo e nao voltaram para a home.

## INFERENCIA ESTRATEGICA

- O problema principal desse trecho nao era apenas estilo visual, mas estrutura: muitas secoes funcionavam como caixas independentes em vez de uma narrativa continua.
- A home precisava de menos "componentes bonitinhos" e mais composicao editorial: linhas, hierarquia, densidade e argumentos clinicos claros.

## RECOMENDACAO EXECUTADA

- Substituida a grade da `care-section` por um fluxo editorial em tres linhas:
  - entender o ponto de partida;
  - montar um plano que caiba na vida real;
  - acompanhar quando o entusiasmo passa.
- Substituido o comparativo `Tentar sozinha` x `Com a Renove` por uma secao clara de diferencas praticas:
  - avaliacao integrada;
  - evolucao objetiva;
  - ajuste de rota.
- Ajustada a copy final da home:
  - saiu `Bora comecar?`;
  - entrou `O primeiro passo e entender seu caso com calma.`
  - CTA mudou para `Organizar minha avaliacao`.
- Ajustado contraste do marcador da secao clara.
- Ajustada escala mobile do titulo da secao clara para evitar quebra pobre de palavra.

## Validacao

Comandos executados em `tools/renove-atlas-site`:

- `npm run qa:content` - passou.
- `npm run qa:a11y` - passou.
- `npm run qa:visual` - passou.
- `npm test` - passou apos a porta temporaria do primeiro teste interrompido liberar.

Resultado final do `npm test`:

- Conteudo: 10 paginas e 14 assets checados.
- Acessibilidade: 10 rotas x 3 larguras.
- Visual: 10 rotas x 5 viewports.

## Prints revisados

- `qa-artifacts/home-1600.png`
- `qa-artifacts/home-390.png`

## Proximo micro-lote recomendado

Revisar a home acima da dobra e a primeira secao de servicos com criterio ainda mais exigente:

- header mobile;
- fotografia/crop do hero;
- proporcao entre texto e imagem em ultrawide;
- CTA primario/secondary CTA;
- possivel uso mais refinado de folhas/motion sem poluir.

