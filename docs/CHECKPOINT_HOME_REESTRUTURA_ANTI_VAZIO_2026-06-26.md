# Checkpoint Home Reestrutura Anti-Vazio - 2026-06-26

## Dor do João

João apontou que a Home ainda parecia ruim na base:

- muito espaço vazio;
- blocos puxados para a esquerda sem composição completa;
- seções centralizadas com vazio dos dois lados;
- aparência de uso de estilos prontos, sem enxergar a diferença real entre os layouts;
- mobile longo, empilhado e com cara de cards.

## Diagnóstico

O problema não era só CSS. A Home tinha três camadas seguidas depois do hero:

1. `decision-rail`
2. `proof-numbers`
3. `atlas-band`

Mesmo com ajustes, isso criava uma sequência de blocos independentes e repetitivos. O visitante via uma landing montada por componentes, não uma página com direção visual contínua.

## Alterações executadas

- Removida a pilha `decision-rail + proof-numbers + atlas-band` do HTML da Home.
- Criada a seção única `home-method`, com:
  - copy de método à esquerda;
  - provas compactas dentro da mesma seção;
  - fluxo de 4 etapas à direita;
  - fundo escuro único com boa legibilidade;
  - sem cards flutuantes.
- Serviços principais foram convertidos no desktop de 3 cards para uma lista editorial em duas colunas:
  - posicionamento/heading à esquerda;
  - serviços como linhas de decisão à direita.
- Mobile:
  - números do método voltaram a ocupar uma linha compacta;
  - serviços deixaram de parecer cards empilhados e viraram lista editorial;
  - a Home ficou menos longa antes de chegar no conteúdo seguinte.

## Validação

- `npm run qa:content` passou.
- `npm run qa:a11y` passou.
- `npm run qa:visual` passou.
- Screenshots atualizados em `qa-artifacts/home-390.png` e `qa-artifacts/home-1600.png`.

## Leitura honesta

Esta rodada melhorou de verdade o começo da Home, porque mudou arquitetura, não só estilo.

Ainda há dívida visual nas seções abaixo:

- `care-section` ainda tem grid de cards claros sobre fundo escuro.
- `proof-section` ainda parece uma seção herdada do lote antigo.
- FAQ/local/CTA ainda funcionam, mas não têm o mesmo nível de direção visual do novo topo.

Próximo passo recomendado: continuar a reestruturação abaixo da dobra, começando por `care-section` e `proof-section`, para que a Home inteira deixe de parecer uma mistura de versões.
