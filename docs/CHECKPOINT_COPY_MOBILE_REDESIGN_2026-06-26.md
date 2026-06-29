# Checkpoint Copy + Mobile Redesign - 2026-06-26

## Dor registrada

João apontou que o site ainda estava feio e distante da visão esperada, com problemas de:

- copy estreita demais;
- tese "Você já emagreceu antes" afunilando quem nunca emagreceu;
- "Veja se a Renove é pra você antes de mandar mensagem" agressivo;
- "Do oi no WhatsApp" informal demais;
- comparação em tabela parecendo brega;
- Home mobile com header e foto ruins;
- sensação geral de landing genérica.

## Decisão de copy

Trocar o eixo de persuasão:

- De: "você já falhou / você já emagreceu / o peso voltou"
- Para: "começar ou retomar com acompanhamento médico"

Motivo: amplia o público sem perder a dor de quem já tentou antes. A copy passa a incluir:

- quem está começando agora;
- quem já tentou e não conseguiu manter;
- quem quer uma avaliação presencial antes de decidir qualquer plano.

## Alterações executadas

- Home:
  - Hero mudou para "Emagrecimento médico com acompanhamento em Bauru."
  - Lead passou a falar de começar com segurança ou retomar com clareza.
  - "Do oi no WhatsApp" virou "Da primeira conversa à avaliação".
  - "Sem formulário frio, sem compra no escuro" virou uma explicação mais clínica: avaliação antes de conduta.
  - Bloco emocional deixou de culpar/centralizar "peso voltou" e passou a falar de sustentação da mudança.

- Página `/emagrecimento-bauru/`:
  - Hero mudou para "Emagrecimento médico com acompanhamento de perto."
  - Lead passou a incluir começo e retomada.
  - "Veja se a Renove é pra você..." virou "Procure a Renove quando você quer um plano acompanhado..."
  - Comparação em tabela "sozinha x Renove" foi removida.
  - Entrou `method-ledger` com 4 pilares: avaliação antes da conduta, médica e nutricionista juntas, medição objetiva e ajuste quando a vida muda.

- Mobile:
  - Header simplificado abaixo de 640px: remove CTA do topo e deixa brand + menu, com sticky CTA no rodapé.
  - Home mobile deixa a foto depois da copy, não antes.
  - Foto da Home no mobile ganhou recorte arredondado e menor altura.
  - `decision-rail` no mobile ficou mais compacta, escondendo parágrafos longos.

## Validação

- `npm run qa:content` passou.
- `npm run qa:a11y` passou.
- `npm run qa:visual` passou.
- Screenshots atualizados em `qa-artifacts/`.

## Leitura honesta

Esta rodada corrigiu direção de copy e alguns problemas gritantes de mobile, mas a Home ainda pode precisar de uma reestruturação mais profunda para sair de vez da sensação de landing modular.

Próximo passo sugerido: redesenhar a Home por arquitetura, não por ajuste de blocos:

1. Hero mais editorial com foto melhor tratada.
2. Menos seções repetidas.
3. Uma seção forte de método Renove, não várias provas pequenas.
4. Serviços como hierarquia clara: emagrecimento principal, estética secundária.
5. FAQ/local/CTA mais enxutos.
