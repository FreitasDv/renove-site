# ROADMAP R9 — FOCO ATIVO (não perder entre tarefas)

> Arquivo-âncora da missão de rebuild do site R9 em `tools/renove-atlas-site`.
> Se eu (qualquer IA) reabrir esta sessão, LER ESTE ARQUIVO PRIMEIRO antes de agir.
> Fonte de verdade do escopo: `RENOVE_R9_SITE_AUTONOMOUS_REBUILD.md`.
> Última atualização: 2026-06-27.

## Missão (carta branca do João, 2026-06-25)
Evoluir o site local com profundidade de produto: benchmark real, matar cara de
IA/template, redesenhar home + internas, criar ferramentas interativas, copy/SEO/CRO,
responsividade e QA. Autonomia para microdecisões. Trabalhar sem parar, se
autocorrigindo, sem desistir por falha de ferramenta. Não inventar prova clínica.

## Freios críticos (NUNCA sem aprovação)
WordPress, Elementor, hospedagem, domínio, DNS, Google/Meta Ads, GTM, GBP, GA4, CRM,
WhatsApp, GoSac, Digisac, webhooks reais, dados de paciente/lead, publicação externa,
mensagens para Arildo/Henrique/pacientes. Não inventar depoimento/foto/resultado/número.

## Compliance Renove (assets e copy)
Proibido: nome de fármaco, dose/mg/posologia, promessa absoluta, kg+prazo, fake UI
button, preço público (preço só "explicado na avaliação"). Usar: "acompanhamento
médico", "protocolo personalizado", "gerenciamento de peso", "composição corporal".

## Gates de QA (rodar antes de concluir lote)
```
cd tools/renove-atlas-site
npm run qa:content && npm run qa:a11y && npm run qa:visual   # ou: npm test
```
WCAG: texto normal ≥4.5, texto grande (≥24px ou ≥18.66px bold) ≥3.0, decorativo ≥3.0.
Console Windows: usar PYTHONIOENCODING=utf-8 nos prints com − (U+2212) e ★.

---

## ✅ FATIA 4 (movimento + folhas) 2026-06-28
- Auditoria das 3 leis de movimento do SPEC (medido, não estimado):
  - SCROLL-REVEAL: já cobre toda seção — `script.js` injeta `data-reveal` via 21
    grupos de seletores (incl. `.section-heading`, que pega todo título), stagger
    70ms cap 5, IntersectionObserver + fallback 1200ms. Lei JÁ satisfeita, não mexido.
  - FOLHAS: sistema `.botanical` maduro (z-index:-1, mask radial centrada, hide
    <640px, float só em prefers-reduced-motion:no-preference) já em care/proof (home),
    emag-proof e sobre. FALTAVAM nas margens "direita-vazia" que o qa:balance aponta.
  - COUNT-UP: números de prova estavam parados (só havia observer de GA4, não count).
- FOLHAS adicionadas onde o balance flagrava vazio: `.botanical-faq-br` (home FAQ,
  canto inferior-direito) e `.botanical-qualifier-r` (emag qualifier, direita). Medido:
  ambas `position:absolute` aterrissando no vão direito (leafL≈2320 @2560), masked fade.
- BUG achado e corrigido (causa raiz, não remendo): as regras `.faq-section-home > *`
  e `.qualifier-section > *` setavam `position:relative;z-index:1` em TODOS os filhos,
  incluindo a folha — anulando o `position:absolute` do `.botanical` (folha caía no
  topo-esquerdo em flow). Fix: adicionado `:not(.botanical)` às 3 regras (1 FAQ + 2
  qualifier), padrão que care/proof já usavam. Sem isto a folha não ancora na margem.
- COUNT-UP (FATIA 4) em `script.js`: anima 0→valor (easeOutCubic 1100ms) quando o
  número entra na viewport (threshold 0.6). Só `4,9` (Google) e `100%` existem (não há
  +400). `4,9` envolvido em `<span class="count-up">` preservando o SVG da estrela
  irmão; formatação pt-BR (vírgula). Roda APÓS o early-return de reduceMotion → com
  movimento reduzido o HTML mantém o valor final (fallback correto). Medido: final
  4,9 / 100% exatos, estrela intacta, 0 erro console.
- NOTA HONESTA sobre o gate: qa:balance IGNORA decorativos por design (mede só
  envelope de conteúdo). Logo a folha é remédio VISUAL da margem vazia (a dor real),
  não muda o número do gate — e isso é o comportamento certo (decoração ≠ conteúdo).
  Os 10 avisos de balance seguem como assimetria natural de grid editorial.
- 10 gates verdes (npm test): content, a11y (10×3), depth (7), visual (11×5),
  transition (5×5), header, grid-align, typography + balance/copy-ai não-bloqueantes.
- PRÓXIMO: Fatias 5 e 6 do SPEC (voz/copy de dinheiro+processo; e gate final/QA de
  fechamento). Ver SPEC seção 8.

## ✅ FATIA 3 (escala & alinhamento) + FIX ALINHAMENTO HOME 2026-06-28
- CAUSA RAIZ do "puxado/desalinhado" na home (medido, não estimado): a banda FAQ
  full-bleed (`.faq-section-home`) sofria DUPLO recuo — a regra base `.faq-section`
  dá `width:min(container)+margin-inline:auto` (280px) e o override da banda soma
  `padding-inline:(100%-container)/2` (280px). Resultado: título FAQ em 560px no
  2560 (e 226px no 1366), fora do eixo canônico 280/113 das demais seções. Por isso
  `qa:grid-align` FALHAVA na home (3 eixos) e estava FORA do `npm test`.
- FIX cirúrgico: `.faq-section-home` agora full-bleed de verdade (`width:100%`,
  `max-width:none`, `margin-inline:0`) — o `padding-inline` sozinho posiciona no
  eixo. Título FAQ voltou a 280px (2560) / 113px (1366). grid-align: home 2 eixos OK.
- FATIA 3 auditada (medição em 5 págs × 6 breakpoints 390→2560):
  - 0 `font-size` em px; os 18 `rem` literais são chrome/ícones (marca, nav, badge,
    aspas decorativas) — fora da lei de tipografia de conteúdo. Não mexido.
  - 0 linha de conteúdo > 74ch; 0 título H1/H2 multi-linha sem `text-wrap:balance`.
    Tipografia de conteúdo já estava disciplinada de passadas anteriores.
- BLINDAGEM (Fatia 3 virou lei instalada, não conserto pontual):
  - Novo gate `scripts/qa-typography.mjs` (no `npm test`): falha se aparecer linha
    longa (>74ch, calibrável via RENOVE_TYPO_MAXCH) ou título multi-linha sem balance.
  - `qa:grid-align` ADICIONADO ao `npm test` (estava órfão porque falhava; agora
    passa e protege contra regressão de eixo).
- FIX local-section ultrawide: mapa esticado p/ preencher a coluna (era sliver 3:1
  ~320px; agora 927×469 proporcional). `align-items:stretch` + iframe
  `height:100%;min-height:360px`. (see.py deu falso-negativo: maps não renderiza em
  headless; geometria validada por medição.)
- 10 gates verdes (npm test EXIT 0): content, a11y (10×3), depth (7), visual (11×5),
  transition (5×5), header, grid-align, typography + balance/copy-ai não-bloqueantes.
- TRADE consciente: balance subiu 8→10 avisos (FAQ agora "direita-vazia" como care/
  proof) — assimetria natural de grid editorial que a FATIA 4 (folhas nas margens)
  vai resolver. Trocar defeito de alinhamento real por aviso não-bloqueante esperado.
- PRÓXIMO: Fatia 4 (movimento + folhas botânicas nas margens vazias do ultrawide:
  hero, care, proof, faq, qualifier) — ataca a "direita-vazia" sem esticar leitura.

## ✅ SPEC-DRIVEN AVANÇADO + FATIA 1 (profundidade) 2026-06-28
- Causa raiz do "tudo péssimo" após 7 passadas: NÃO era conserto pontual faltando,
  era falta de SISTEMA (leis de ritmo tonal/transição/profundidade). Spec escrito:
  `SPEC_SISTEMA_DESIGN_R9_2026-06-28.md` — andares CLARO/TINTA/PROFUNDO, sistema de
  transição T1-T4, escala/alinhamento, movimento, voz, gates, plano em 6 fatias.
  João aprovou: executar as 6 fatias usando o BENCHMARK_30 como referência.
- FATIA 1 (lei de profundidade) FEITA + travada:
  - Novo gate `scripts/qa-depth.mjs` (no `npm test`): falha se seção full-bleed de
    marca renderizar cor sólida sem gradiente/véu/folha. Achou 5 chapadas.
  - Utilitários reusáveis `.depth-tint` / `.depth-deep` (via ::before, não
    sobrescrevíveis pelo `background` shorthand).
  - Aplicados em: differentials (emag), service-grid (hof), values (sobre),
    map (contato), blog-index. + qualifier (emag) e home-method já corrigidos antes.
  - 4 gates verdes: content, a11y, depth (7 rotas), visual (11×5).
- PRÓXIMO: Fatia 2 (sistema de transição T1-T4, matar cortes retos).

## ✅ COPY AMPLA + PROFUNDIDADE SEÇÕES CLARAS (6ª passada) 2026-06-28
- Copy humanizada estendida a TODAS as páginas (não só críticos):
  - Home: "A página não precisa prometer transformação milagrosa" → "A gente não
    promete atalho. Promete presença..."; "presença local consolidada" → "pacientes
    daqui de Bauru"; "Agendamento organizado" → "marca seu horário antes, sem fila".
  - Sobre: "Três pilares que sustentam cada protocolo" → "Três coisas que a gente
    nunca abre mão"; team-intro humanizada.
  - Contato: CTA "Abrir conversa" → "Chamar no WhatsApp"; copy do card humanizada.
  - GATE PEGOU "milagre" (mesmo negado = termo proibido) → troquei p/ "atalho".
- Profundidade nas seções CLARAS chapadas (raiz do "seco"):
  - emag `.qualifier-section` (era glacier chapado) → 2 véus radiais frios
    (aqua + ocean, alpha baixo). Texto 9.34:1 (AA folgado).
  - home `.home-method`: gradiente de profundidade estava sendo SOBRESCRITO por
    `background: var(--deep-blue)` no media query 980px → corrigido p/ manter glow
    em todos os tamanhos. Folha flutuante confirmada.
  - home `.proof-section` já tinha véus ::before/::after (ok).
- QA: 3 gates verdes (content, a11y, visual 11×5).
- PENDENTE: agente de mapa de seções claras travou (0 bytes) — fiz manual as
  principais; faltam ecos menores (faq tint, divisores entre seções claras).

## ✅ COPY (tom humano) + PROFUNDIDADE NA EMAGRECIMENTO (5ª passada) 2026-06-28
- Prints do João analisados (eye.py): contraste tonal 1.03-1.09:1 (design chapado),
  respiro 46-85% (zonas secas), copy fria/burocrática.
- Auditoria de tom (agente) achou a raiz: o tom quente da marca SOME nas seções de
  dinheiro/processo (investimento, formato, "como funciona"), onde a copy virou
  defensiva por medo de compliance (voz passiva + pilha de substantivos).
- CRÍTICOS corrigidos (compliance preservado, voz "a gente" do AGENTS.md):
  - emag `.investment-section`: "O investimento é explicado..." → "Sobre quanto
    custa: a gente te explica tudo na avaliação, olhando no olho."
  - emag `.plan-ladder` (formato): reescrito p/ "O cuidado certo pra você a gente
    define junto" + cards "A gente entende seu caso primeiro" etc.
  - emag qualifier "Formato"/"Segurança" + timeline h2/itens: humanizados.
  - HOF `.split-section` + hero + CTA: "Vamos conversar sobre o seu rosto?" etc.
- Profundidade visual: emag `.proof-section` (era #102a3d chapado) ganhou glow
  radial + folha botânica visível, igual home.
- Auditoria completa salva (resultado do agente) — restam IMPORTANTES/MELHORIAS de
  copy em home/sobre/contato e os ecos do disclaimer repetido.
- QA content verde; visual rodando.

## ✅ REVISÃO ESTRATÉGICA + PROFUNDIDADE VISUAL (4ª passada) 2026-06-28
- Reli a espinha real: AGENTS.md, regras, DECK DE PROPOSTA ao Arildo, calendário,
  skill clinic-growth-advisor. Achei 3 conflitos cross-cutting:
  1. Deck prometia calculadora de "estimativa de dose" = prescrição mecanizada,
     proibida (CFM + pesquisa do Arildo proíbe dose em 4 pontos). **CORRIGIDO** no
     deck (linha 1212 → "IMC, gasto calórico e quiz"). Backup .bak gerado.
  2. Onda 2 do blog nomeia fármaco — decisão pendente Dra. Juliana (orgânico ≠ pago).
  3. Ferramentas posicionadas como vitrine, mas gargalo é meio/fundo do funil.
- POLÍTICA GOOGLE pesquisada (doc `POLITICA_GOOGLE_ORGANICO_VS_PAGO_2026-06-28.md`):
  PAGO restringe nome de fármaco em ads/LP/keyword (risco de conta); ORGÂNICO não
  tem lista proibida — o que derruba SEO médico 2026 é falta de E-E-A-T (autoria
  da médica), conteúdo raso e página de cidade templatizada. Logo: fármaco no blog
  assinado pela Dra. é seguro e recomendado; nunca no pago.
- PROFUNDIDADE VISUAL home (corrige "fundos sólidos chapados, cortes secos, sem
  folhas"): seções escuras `.home-method` e `.care-section` ganharam glow radial
  (faixa tonal 248/255 = profundidade real, medido eye.py) + folhas botânicas
  visíveis (brightness 2.4 + tom aqua, animadas botanicalFloat/driftSoft) + véu de
  gradiente nas bordas. Antes eram blocos #102a3d chapados com folha invisível.
- Docs: `REVISAO_ESTRATEGICA_FERRAMENTAS_2026-06-28.md` + política Google.
- PENDENTE (decisões João+Dra.): fármaco no orgânico; quiz/checklist embutidos na
  LP; demais cortes secos do site (faq/local/rodapé) e animação de números.

## ✅ FEITO (FATO VERIFICADO)
1. Benchmark 30 refs → `docs/BENCHMARK_30_REFERENCIAS_R9_SITE_2026-06-26.md`.
2. Home redesenhada (hero/header editorial, anti-vazio, fundos com profundidade aquarelada).
3. Página emagrecimento reescrita (prova editorial, comparativo descardado, ledger).
4. Ferramentas: `ferramentas/index.html` com 3 calculadoras (IMC, TDEE, meta de tempo).
5. Captura de lead: form → WhatsApp pré-preenchido, validação, herda UTMs.
6. Compliance de preço: vazamento removido do build; `brief/` movido p/ `_internal/`.
7. QA: 3 gates verdes (content 10 págs, a11y 10×3, visual 10×5).
8. QA multiformato 9 págs × 3 viewports (390/1366/2560): zero overflow, touch ≥44px,
   contraste WCAG AA limpo. Bugs corrigidos: `.micro-note` 760px→62ch; placeholder
   contraste 3.9→10.3. (sessão 2026-06-27)
9. **P1 RESOLVIDO/VERIFICADO**: hero-copy NÃO colapsa mais em ultrawide
   (640px@1920, 832px@2560/3440; hero-lead ~50ch/linha). Conserto pegou.
10. **P2 RESOLVIDO/VERIFICADO**: schema médico já existe e completo — MedicalClinic,
    MedicalWebPage, Physician, Service, FAQPage, BreadcrumbList nas páginas certas.

## ✅ FERRAMENTAS — REESTRUTURA EM ABAS (3ª passada) 2026-06-27
Carta do João: "ferramentas feias, layout errado/desalinhado, ver multiformato,
página talvez não faça sentido, scroll gigante". Diagnóstico por medição real:
página tinha **10.299px no mobile / 6.630px desktop** com as 5 ferramentas
empilhadas — daí a sensação de feio e infinito.
- Fix de contraste (pego pelo qa-visual que AGORA cobre /ferramentas/): aba ATIVA
  tinha num/tag invisíveis (1.00:1) por especificidade; corrigido p/ branco em
  pílula escura (9.09:1 petrol / 6.71:1 amber).
- Transição da home: `.home-method` ganhou folha translúcida flutuante + véu de
  gradiente nas bordas no lugar do corte reto.
- DECISÃO ESTRUTURAL: trilha 01–05 virou **interface de abas REAL** (role=tablist,
  setas do teclado, aria-selected). Uma ferramenta visível por vez. Sem JS, tudo
  fica visível (fallback + SEO).
- RESULTADO medido: mobile 10.299→4.147px (−60%), desktop 6.630→2.920px (−56%).
- Mobile: trilha vira **faixa horizontal rolável** (tab strip, scroll-snap, alvo
  ≥44px) em vez de lista vertical alta. Aba ativa em cor sólida da fase (petrol/
  ocean/amber) + texto branco — destaque forte. Verificado no browser + see.py.
- QA route `/ferramentas/` ADICIONADA ao qa-visual.mjs (antes a página nunca era
  testada visualmente — era um gap).
- Fix tipográfico: "Entenda seus números" não quebra mais órfão (.nowrap no hero).
- Gates content + a11y verdes. Visual rodando com a nova rota.
- AGENTE em background: auditoria site-wide de cortes bruscos de fundo + overflow
  de texto multiformato + folhas/motion faltando (pendente do João revisar).

## ✅ FERRAMENTAS — APROFUNDAMENTO DE PRODUTO (2ª passada) 2026-06-27
Após carta "vá mais fundo": pesquisa web (UX de tools de saúde) + 2 agentes paralelos
(auditoria UX de 12 itens + matriz de publicação de 43 peças). Implementado e VERIFICADO
no browser:
- **IMC**: resultado agora mostra faixa de peso de referência p/ a altura (ex.: 52–70 kg)
  + marcador da escala com transição animada.
- **TDEE**: 4º card "Proteína sugerida" (~1,6 g/kg, educativo) + piso de segurança no
  déficit (nunca <1200/1500 kcal, troca a mensagem) + card "déficit" destacado âmbar.
- **Meta**: 1º marco (~25% da meta em N semanas) no texto + enquadramento de jornada
  longa p/ metas grandes.
- **Quiz**: régua de prontidão 0–12 (3 bandas) + CTA diferenciado por perfil
  (acolhedor→agendar) + valoriza o esforço das 6 perguntas.
- **Checklist**: tag dinâmica "Seu roteiro tem N pontos".
- **Todos**: scrollIntoView no resultado (reduced-motion safe) — mata o "cliquei e não
  aconteceu nada" no mobile; inputs em grid preenchem a coluna (fim do serrilhado);
  micro-interação de submit + pulso no valor.
- VERIFICADO no browser: IMC faixa 52–70, TDEE proteína 131g/déficit 1854, quiz score
  máx→"plano estruturado"+CTA "agendar"+escala 96%, checklist "3 pontos". QA: 3 verdes.
- Docs de decisão: `docs/04_SITE_LP/MATRIZ_PUBLICACAO_BLOG_43_PECAS_2026-06-27.md` +
  `BRIEF_DECISAO_BLOG_E_FERRAMENTAS_2026-06-27.md`.
- PENDENTE não-bloqueado: placeholder de pré-resultado na coluna direita (G1 do audit);
  link "próximo passo" da trilha em cada resultado (G5); botão "copiar checklist".

## ✅ FERRAMENTAS REDESENHADAS — sessão 2026-06-27 (UI/UX + produto)
- Diagnóstico inicial (eye.py): 53% respiro / 17% densidade, cards genéricos idênticos,
  pills que pareciam tabs falsas, disclaimer = muro de texto em fundo bege.
- Entregue: hero com profundidade (folhas CSS + faixa "5 ferramentas · ~2 min ·
  revisado pela Dra."); **trilha guiada** de 5 cards numerados 01-05 com fases
  Medir→Planejar→Agir (substitui as pills, dá lógica de produto); badge de passo
  (disco numerado) + acento lateral por fase em cada card (mata cards idênticos);
  disclaimer reestruturado em cabeçalho + grade de 3 pontos.
- VERIFICADO por medição no browser @2560px: 5 cards mesma altura (226px), mesmo
  top/bottom, tags ancoradas (margin-top:auto, 19px do rodapé, idênticas); gap
  hero→IMC = 52px (não os 200px do screenshot velho em cache). QA: 3 gates verdes.
- PENDENTE não-bloqueado: densificar área de inputs de cada ferramenta (UX premium).
- Brief editorial salvo: `docs/04_SITE_LP/BRIEF_DECISAO_BLOG_E_FERRAMENTAS_2026-06-27.md`
  (1ª leva, destino dos 3 posts, compliance fármaco, plano de imagens — decisões do João).
- AggregateRating auto-declarado eliminado por completo. JSON-LD já não tinha o
  `aggregateRating` nos arquivos vivos (só nos .bak de 19:30). O widget visual
  `.google-rating` "4,9 no Google" foi REMOVIDO de index, emagrecimento e HOF.
  Selos verificáveis preservados: CRM-SP 182.823, RQE 133.088, Dra. Juliana Reis,
  Nutrologia Einstein, Mestrado USP-Bauru. CSS `.google-rating` em styles.css ficou
  órfão (inofensivo); pode ser podado num lote de limpeza futuro.

## ⏳ PENDENTE — não-bloqueado (FILA ATIVA)
- [x] **P3 — Quiz de prontidão**: JÁ ESTAVA FEITO (HTML linhas 302-357 + JS cabeado).
      6 perguntas, score → 3 perfis, CTA WhatsApp contextual. Roadmap estava desatualizado.
- [x] **P4 — Checklist de prontidão p/ consulta**: FEITO (sessão 2026-06-27). Seção
      `#calc-checklist` em `ferramentas/index.html` + módulo em `tools.js` + estilo
      `.tool-check-summary` (cartão-documento branco c/ sombra, marcador petrol). Paciente
      marca itens (levar/comentar) + dúvida opcional → resumo na tela + msg WhatsApp com
      UTM `tool_checklist`. Validado: funcional (Playwright, 0 erros console), 3 gates
      verdes, see.py (lê como documento premium), compliance limpo (sem fármaco/promessa).
- [x] **P5 — GA/tracking**: JÁ RESOLVIDO (roadmap desatualizado). Verificado por leitura
      direta 2026-06-27: NÃO existe mais `G-XXXXXXXXXX` nem `gtag(` em nenhum blog. Os 3
      posts (creatina, dieta-ou-acompanhamento, emagrecimento-saudavel) + blog/index já
      carregam o GTM-TJ77VNSV no head e noscript, igual às páginas principais. Decisão do
      João (unificar no GTM) já está atendida no código.
- [x] **P6 — Nav das ferramentas**: JÁ RESOLVIDO (roadmap desatualizado). Decisão do João
      (link contextual) já está na LP de emagrecimento, linha ~344: "Quer ir além do IMC?
      Veja também o gasto calórico estimado e o tempo aproximado para a sua meta" →
      `/ferramentas/`. Há também link no footer da LP (linha ~632).

## 🔒 BLOQUEADO — depende de material do João (NÃO inventar)
- B1. Foto única repetida nos 3 heros → precisa imagens reais variadas.
- B2. Depoimentos reais → slot `SLOT MATERIAL REAL` oculto no index, espera texto+consentimento.
- B3. Resultados/antes-depois → mesma trava (ver `MATERIAL-NECESSARIO.md`).

## Estado técnico do projeto
- Server local: `npm run serve` (porta usada nesta sessão: 4187).
- styles.css ~5000 linhas, tokens :root (--ocean #23648c, --petrol #296c7b,
  --deep-blue #102a3d, --sand #ece0d2, terracota = única cor de ação).
- Fontes: Literata (display) + Ubuntu (texto).
- NADA commitado nem publicado. Backups .bak gerados automaticamente nas edições.
