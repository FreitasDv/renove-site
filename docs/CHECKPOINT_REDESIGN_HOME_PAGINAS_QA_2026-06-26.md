# Checkpoint - redesign home + páginas internas

Data: 2026-06-26

## Escopo desta rodada

- `index.html`
- `styles.css`
- `emagrecimento-bauru/index.html`
- `harmonizacao-facial-bauru/index.html`
- `sobre/index.html`
- `contato/index.html`

## O que entrou

### Home

- hero com dois painéis flutuantes para reduzir vazio visual e ancorar:
  - atendimento presencial;
  - escada de planos/preços;
- FAQ refeito para composição editorial em 2 colunas;
- seção local enriquecida com resumo de visita;
- CTA final com wrapper próprio para controlar melhor largura/ritmo.

### Emagrecimento

- hero ganhou resumo factual curto;
- FAQ virou composição editorial com resumo decisório.

### Harmonização

- hero ganhou resumo factual curto;
- FAQ virou composição editorial com resumo decisório.

### Sobre

- hero ganhou resumo institucional e CTA direto.

### Contato

- hero ganhou resumo operacional do contato;
- painel lateral virou lista institucional mais clara;
- schema `telephone` placeholder corrigido para `+55-14-98154-0709`.

### Sistema visual/CSS

- criada família `summary-list-lite`;
- criada família `faq-layout` / `faq-editorial`;
- criados painéis flutuantes do hero da home;
- reforço de motion sutil nos botânicos e cartões do hero;
- responsivo específico para FAQ/layouts e painéis flutuantes.

## QA

- `npm run qa:content` -> OK
- `npm run qa:a11y` -> OK
- `npm run qa:visual` -> OK

## Observação

- O contraste do kicker do painel do hero falhou na primeira passada e foi corrigido antes do gate final.
