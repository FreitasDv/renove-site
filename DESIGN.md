# Renove Atlas Site - direcao de design vigente

Atualizado em 2026-06-27. Este arquivo governa os proximos micro-lotes visuais do prototipo local.

## Objetivo

Construir um site clinico de alto nivel que una clareza, confianca, densidade editorial e conversao sem parecer template, pagina de IA ou parede de cards.

## Direcao

- Linguagem visual: editorial clinico assimetrico.
- Tipografia: Literata para hierarquia editorial; Manrope para leitura e interface.
- Paleta: papel quente, azul profundo, ocean/petrol, aqua e clay apenas como acento.
- Imagem: fotografia real da equipe e da clinica como prova, nao como decoracao generica.
- Movimento: discreto e funcional; folhas botanicas podem criar ritmo e profundidade sem disputar com o conteudo.

## Regras de composicao

- Variar largura e anatomia das secoes conforme a funcao; nao repetir o mesmo container central em toda a pagina.
- Evitar titulos estreitos ou centralizados que deixem grandes vazios dos dois lados.
- Usar faixas full-width, grids assimetricos e ledgers editoriais para distribuir massa visual.
- Reservar cards para itens realmente independentes; comparacoes, processos e diferenciais devem preferir divisorias e sequencias.
- Nao usar card dentro de card, sombras decorativas repetidas, glassmorphism ou bordas arredondadas em toda superficie.
- Toda quebra de linha relevante precisa parecer intencional em 390, 768, 1024, 1280 e 1600 px.

## Copy e oferta

- Falar com quem esta comecando e com quem esta retomando, sem afunilar o publico sem evidencia.
- Evitar abordagem agressiva, julgamento, promessa absoluta e linguagem de bastidor.
- Explicar avaliacao, acompanhamento e ajuste com linguagem humana e clinica.
- Nao exibir precos, nomes de planos ou ladder comercial no site ate aprovacao explicita do cliente e do Joao.

## Gate antes de considerar um lote pronto

- `npm run qa:content`
- `npm run qa:a11y`
- `npm run qa:visual`
- Inspecao dos screenshots da rota alterada em mobile, desktop e ultrawide.
- Nenhuma publicacao, WordPress, dominio ou hospedagem sem aprovacao humana explicita.

## Historico de moves visuais (home)

### Sessao 2026-06-27 (madrugada) — acabamento editorial

- MOVE 8 — `hr`, estrelas e bullets ganharam intencao de design (regua fina degradê, ★ inline tonal, bullets como marca, nao default do browser).
- MOVE 9 — fundo botanico desfocado refinado para profundidade tom-sobre-tom, sem disputar com conteudo.
- MOVE 10 — cadencia vertical sincopada: padding alterna 96px (conectivas) e 130px (batidas emocionais care/outcomes), quebrando o metronomo.
- MOVE 11 — medida de linha do CTA travada em 56ch desde a base; antes esticava ate ~74ch em tablet. Agora 56-63ch em todas as larguras.
- QA: qa:content OK, qa:a11y OK, sem overflow-x e 0 erros de console em 390/1366px. Contraste do CTA AA folgado.

### Defeitos restantes (BLOQUEADOS — exigem material/aprovacao do Joao)

- Metricas de prova (+400 pacientes, 4.9 estrelas, 100%) precisam de ancoragem real: data de inicio, nº de avaliacoes verificadas, fonte. Nao inventar.
- CTA principal poderia descrever a proxima acao real do processo da clinica (ex.: "avaliacao inicial") em vez de estado emocional — depende do fluxo real confirmado.
- Foto unica repetida nos heros, depoimentos e resultados reais seguem travados por falta de material verdadeiro e consentimento.
