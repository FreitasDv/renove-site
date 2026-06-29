# Checkpoint - Home hero/header com skills - 2026-06-26

## Fonte do pedido

Joao pediu para seguir em frente sem deixar de usar skills.

## Skills usadas

- `frontend-design`: direcao visual mais autoral, menos template.
- `ui-craft`: anti-card-wall, responsivo, hierarquia, acessibilidade e touch targets.
- `build-web-apps:frontend-testing-debugging`: validacao renderizada com QA visual.
- `joao-frontend-visual-forge`: referencia externa antes de codar e disciplina anti-generico.

Referencia externa ancorada:

- `C:/Users/creat/.agents/design-reference/INDEX.md`
- A decisao usou GOV.UK/USWDS como referencia de clareza, navegacao acessivel e botao/menu, nao como estetica literal.

## FATO VERIFICADO

- A primeira dobra mobile ainda parecia fraca: foto como retangulo secundario depois dos CTAs, header sem acao direta visivel e pouca densidade clinica entre headline e botao.
- A home ja tinha passado no QA anterior, mas a percepcao visual ainda podia melhorar no topo.

## INFERENCIA ESTRATEGICA

- A foto da equipe deve ser prova de autoridade logo no comeco, especialmente no mobile.
- O header mobile pode ter WhatsApp como botao icone sem repetir texto ou poluir.
- A hero precisa de uma camada curta de prova clinica antes do CTA para nao parecer promessa publicitaria solta.

## RECOMENDACAO EXECUTADA

- Reordenada a estrutura da hero para permitir foto como abertura visual no mobile.
- Mantido o layout desktop com texto e foto na mesma linha via `grid-row: 1`.
- Adicionada `hero-proof-list` com:
  - Avaliacao presencial;
  - Equipe medica + nutricionista;
  - Evolucao por bioimpedancia e ajuste de rota.
- Header mobile voltou a mostrar WhatsApp como botao icone de 44px, preservando texto acessivel escondido.
- Legenda da foto no mobile fica sobreposta na imagem, nao solta abaixo.

## Validacao

Comandos executados em `tools/renove-atlas-site`:

- `npm run qa:content` - passou.
- `npm run qa:a11y` - passou.
- `npm run qa:visual` - passou.
- `npm test` - passou.

Resultado final do `npm test`:

- Conteudo: 10 paginas e 14 assets.
- Acessibilidade: 10 rotas x 3 larguras.
- Visual: 10 rotas x 5 viewports.

Prints revisados:

- `qa-artifacts/home-1600.png`
- `qa-artifacts/home-390.png`

## Proximo micro-lote recomendado

Levar a mesma disciplina para paginas internas, com prioridade:

1. `emagrecimento-bauru/`
2. `harmonizacao-facial-bauru/`
3. `sobre/`
4. `contato/`
5. templates de blog/artigos

