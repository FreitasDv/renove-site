# SPEC — Renove Atlas Site: Sistema de Design Enforçável + Plano de Rebuild

**Data:** 2026-06-28 · **Autor:** Kiro/Claude Code
**Status:** SPEC governante. Vence os micro-lotes avulsos. Nada publicado.
**Por que este doc existe:** 7 passadas de patches e o João ainda vê "tudo péssimo". Diagnóstico de causa raiz abaixo. Patch-por-seção não resolve porque não há um SISTEMA que segure o conjunto — cada conserto briga com o anterior. Este spec define o sistema com VALORES e LEIS verificáveis, e um plano de execução em fatias com gate por fatia.

---

## 0. DIAGNÓSTICO DE CAUSA RAIZ (por que ainda está feio)

FATO VERIFICADO (do feedback acumulado do João + auditorias):
1. **Fundos sólidos chapados** com cortes retos secos entre seções (6+ na home).
2. **Copy fria/burocrática** justo nas seções de dinheiro/processo (voz passiva, pilha de substantivos).
3. **Desalinhamento** e quebras de linha ruins do desktop ao 390px.
4. **Falta de movimento/folhas** — seções estáticas e secas.
5. **Tom tonal achatado** — tudo creme claro, sem âncora, copy se fundindo no fundo.

INFERÊNCIA — a causa raiz é UMA: **existe um conjunto rico de tokens (`:root`) e um DESIGN.md direcional, mas NÃO existe uma camada de LEIS que governe como as seções se relacionam** — ritmo de cor, sistema de transição, profundidade obrigatória, escala de movimento. Sem essa camada, cada seção foi estilizada isolada, em momentos diferentes, e o resultado é colcha de retalhos. **A correção não é mais um patch — é instalar essa camada de leis e refatorar as seções para obedecê-la.**

---

## 1. PRINCÍPIO REITOR

> Editorial clínico premium = **ritmo + profundidade + tom humano**, nunca decoração.
> Toda seção pertence a um de 3 "andares tonais", transiciona suavemente para o vizinho, tem profundidade (nunca cor 100% chapada), e fala com a paciente como gente.

---

## 2. SISTEMA DE ANDARES TONAIS (a lei de ritmo)

Toda seção full-bleed DEVE declarar um de 3 andares. Proíbe-se 2 andares "claros" idênticos adjacentes sem transição.

| Andar | Uso | Base | Profundidade obrigatória |
|---|---|---|---|
| **CLARO** | leitura, FAQ, listas | `--cream` / `--surface` | 2 véus radiais alpha 0.04–0.10 (tons ocean/aqua) OU folha 0.06 |
| **TINTA** | seções de respiro/transição | `--glacier` / `--sand` (alterna) | véus de aquarela (padrão `.split-section.warm` já validado) |
| **PROFUNDO** | núcleo emocional, prova, CTA | `--deep-blue` | glow radial petrol (alpha 0.5) + véu escuro + folha clareada (brightness 2.4) |

**LEI DE ALTERNÂNCIA (home):** CLARO(hero) → PROFUNDO(método) → TINTA(serviços) → PROFUNDO(care) → TINTA(prova) → CLARO(faq) → TINTA(local) → PROFUNDO(cta). Nunca CLARO→CLARO direto.

**LEI DE PROFUNDIDADE:** nenhuma seção full-bleed pode ter `background: <cor sólida>` puro. Sempre cor + ≥1 gradiente/véu. (Teste automatizável — ver §7.)

---

## 3. SISTEMA DE TRANSIÇÃO ENTRE SEÇÕES (mata o "corte seco")

Toda fronteira entre dois andares diferentes recebe UM device de transição (escolher por contexto, nunca deixar corte reto):

- **T1 — Véu de borda:** a seção que recebe tem `::after` com gradiente da cor do vizinho dissolvendo em ~64–80px (já aplicado em care/home-method).
- **T2 — Folha-ponte:** folha botânica translúcida atravessando a fronteira (straddle), virando o corte em momento de marca.
- **T3 — Degrau tonal:** quando CLARO encontra TINTA, um hairline `--rule` + 1 passo de tom, não corte.
- **T4 — Overlap:** seção PROFUNDO (cta) com `border-radius` + margin negativa puxando sobre a anterior (padrão do `.cta-section` já validado).

**LEI:** fronteira PROFUNDO↔CLARO usa T1+T2. CLARO↔TINTA usa T3. Última seção (CTA) usa T4.

---

## 4. ESCALA & ALINHAMENTO (mata desalinhamento e quebra de linha)

- **Tipografia:** usar SÓ os tokens `--t-xs…--t-2xl`. Proibido `font-size` hardcoded fora deles.
- **Medida de linha:** corpo 56–66ch; nunca >70ch (gera linha solta) nem <45ch em desktop.
- **Órfãos:** títulos com `text-wrap: balance`; partes que não podem quebrar usam `.nowrap`.
- **Grid:** seções editoriais usam grid assimétrico declarado (ex.: `0.84fr 1.16fr`); inputs/colunas preenchem a coluna (sem `max-width` fixo serrilhando — bug já corrigido nas ferramentas).
- **LEI DOS 5 BREAKPOINTS:** toda quebra relevante revista em 390/768/1024/1280/1600. Gate visual cobre isso.

---

## 5. MOVIMENTO (discreto, funcional)

- Scroll-reveal (`data-reveal` + IntersectionObserver) JÁ existe — estender a TODA seção de conteúdo, stagger 70ms, cap 5.
- Folhas: `botanicalFloat`/`driftSoft` (11–15s) nas seções PROFUNDO e em 1–2 CLARO de respiro. Nunca em todas (vira ruído).
- Números de prova (+400, 4,9, 100%): count-up no reveal (hoje parados).
- `prefers-reduced-motion`: tudo neutralizado. (Já respeitado.)
- **LEI:** zero animação puramente decorativa que dispute com leitura; movimento serve hierarquia ou marca.

---

## 6. COPY (voz da marca — AGENTS.md)

- Voz: "a gente", "você", quente e próximo. Proibido voz passiva burocrática ("é definido", "conforme necessidade clínica, adesão e objetivo").
- Seções de DINHEIRO/PROCESSO são as mais críticas: é onde o tom gela e perde conversão. Tratar com mais calor, não menos.
- Compliance inegociável: sem fármaco/dose/promessa absoluta/kg+prazo. Termos seguros do AGENTS.md. (Gate `qa:content` bloqueia — já pegou "milagre".)
- CTAs: ação real ("Quero entender meu caso"), nunca robótico ("Abrir conversa").

---

## 7. GATES VERIFICÁVEIS (Definition of Done por fatia)

Uma fatia só está PRONTA quando:
1. `npm run qa:content` verde (compliance + estrutura).
2. `npm run qa:a11y` verde (contraste AA via walker).
3. `npm run qa:visual` verde (11 rotas × 5 viewports, 0 overflow, 0 erro console).
4. **NOVO — teste de profundidade:** script que falha se alguma seção full-bleed tiver `background` de cor sólida sem gradiente/véu (a ser adicionado em `scripts/qa-depth.mjs`).
5. Inspeção visual real (eye.py local mede faixa tonal ≥200/255 = profundidade; see.py quando o gateway permitir) em mobile + desktop da rota alterada.
6. Medição no browser (não estimativa) de alinhamento/contraste dos elementos tocados.

---

## 8. PLANO DE EXECUÇÃO EM FATIAS VERTICAIS (ordem, com gate cada uma)

Em vez de patch por seção, refatorar por CAMADA do sistema, uma fatia fechada por vez:

- **Fatia 1 — Lei de andares + profundidade obrigatória.** Auditar toda seção full-bleed (home, emag, hof, sobre, contato), classificar em CLARO/TINTA/PROFUNDO e garantir profundidade em todas. Adicionar `qa:depth.mjs`. Gate.
- **Fatia 2 — Sistema de transição.** Aplicar T1–T4 em todas as fronteiras. Eliminar todo corte reto. Gate.
- **Fatia 3 — Escala & alinhamento.** Varredura de `font-size` hardcoded → tokens; medida de linha; órfãos; quebras nos 5 breakpoints. Gate.
- **Fatia 4 — Movimento.** Estender scroll-reveal a todas as seções; count-up nos números; folhas nas seções certas. Gate.
- **Fatia 5 — Copy.** Aplicar a auditoria de tom completa (críticos já feitos; resta IMPORTANTES/MELHORIAS) página por página. Gate.
- **Fatia 6 — Ferramentas no funil.** Reposicionar quiz/checklist na LP (decisão estratégica pendente do João). Gate.

Cada fatia: implementa → roda os 4 gates + inspeção → checkpoint no roadmap → próxima. Sem pular, sem misturar.

---

## 9. DECISÕES PENDENTES QUE BLOQUEIAM PARTE DO PLANO (João + Dra. Juliana)

1. Fármaco no orgânico (libera Onda 2 do blog) — ver `POLITICA_GOOGLE_ORGANICO_VS_PAGO_2026-06-28.md`.
2. Quiz/checklist embutidos na LP de emagrecimento (Fatia 6).
3. Métricas de prova reais (+400, 4,9, nº avaliações) — hoje não-ancoradas, não inventar.
4. Foto real variada para heros (hoje 1 foto repetida).

---

## 10. SÍNTESE DE UMA FRASE
> Parar de remendar seção por seção e instalar uma camada de LEIS (andares tonais, transições, profundidade obrigatória, escala, movimento, voz) com gate automatizável por fatia — porque o site não está feio por falta de conserto pontual, está feio por falta de sistema que segure o conjunto.
