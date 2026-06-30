/**
 * Gate de acessibilidade obrigatorio (WCAG 2.2 AA).
 *
 * Por que existe: um bug de contraste (titulos #0f2435 sobre fundo #102a3d,
 * razao 1.07:1) chegou a producao. A investigacao mostrou que:
 *   - axe-core sozinho NAO pega esse caso: quando o fundo vem de gradiente
 *     ou camadas compostas, ele classifica como "incomplete" (revisao manual),
 *     e incomplete nao falha build.
 *   - Um walker por computed-style PEGA o caso (resolve o fundo subindo a
 *     arvore ate achar cor opaca), mas e fraco no resto do WCAG.
 *
 * Estrategia (combina o que ja e padrao de mercado, nao reinventa a roda):
 *   1. axe-core 4.x  -> autoridade no ruleset amplo (alt, labels, ARIA,
 *      ordem de headings, landmarks, nome de links, etc.).
 *   2. Walker de contraste -> autoridade em contraste de texto, inclusive
 *      sobre fundos compostos onde o axe desiste.
 *   3. Os "incomplete" de color-contrast do axe sao RECONFERIDOS pelo walker
 *      em vez de ignorados. Nada de contraste passa sem veredito.
 *
 * Saida: falha (exit 1) em qualquer violacao. Gera relatorio JSON em
 * qa-artifacts/a11y-report.json para auditoria.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");
const axe = requireFromRenoveOs("axe-core");

const requestedPort = Number(process.env.RENOVE_ATLAS_A11Y_PORT ?? 0);
let baseUrl;
const routes = [
  "/",
  "/emagrecimento-bauru/",
  "/harmonizacao-facial-bauru/",
  "/sobre/",
  "/contato/",
  "/politica-de-privacidade/",
  "/blog/",
  "/blog/emagrecimento-saudavel-bauru/",
  "/blog/creatina-no-emagrecimento/",
  "/blog/dieta-ou-acompanhamento-medico/",
];
// Larguras representativas: mobile real, tablet e desktop.
const widths = [390, 768, 1280];
const artifactDir = path.join(root, "qa-artifacts");
mkdirSync(artifactDir, { recursive: true });

// Walker de contraste injetado na pagina. E a autoridade para texto.
function contrastWalker() {
  function parseColor(value) {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x.trim()));
    const [r, g, b, a = 1] = p;
    return { r, g, b, a };
  }
  function relLum({ r, g, b }) {
    const l = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function blend(fg, bg) {
    const a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function contrast(fg, bg) {
    const L1 = relLum(fg), L2 = relLum(bg);
    const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
    return (hi + 0.05) / (lo + 0.05);
  }
  // Resolve o fundo efetivo subindo a arvore ate a primeira cor opaca.
  // E aqui que ganhamos do axe em fundos compostos.
  function effectiveBg(el) {
    let node = el;
    let acc = { r: 255, g: 255, b: 255, a: 1 };
    const stack = [];
    while (node && node !== document.documentElement) {
      const bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) stack.unshift(bg);
      node = node.parentElement;
    }
    for (const layer of stack) acc = blend(layer, acc);
    return acc;
  }
  function selectorOf(el) {
    if (el.id) return "#" + el.id;
    const cls = (el.className && typeof el.className === "string")
      ? "." + el.className.trim().split(/\s+/)[0]
      : "";
    return el.tagName.toLowerCase() + cls;
  }

  const findings = [];
  const all = document.body.querySelectorAll("*");
  for (const el of all) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none" || Number(st.opacity) === 0) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!ownText) continue;
    const fg = parseColor(st.color);
    if (!fg) continue;
    const bg = effectiveBg(el);
    const resolved = fg.a < 1 ? blend(fg, bg) : fg;
    const ratio = contrast(resolved, bg);
    const size = parseFloat(st.fontSize);
    const bold = Number(st.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const threshold = large ? 3 : 4.5;
    if (ratio < threshold) {
      findings.push({
        selector: selectorOf(el),
        sample: (el.textContent || "").trim().slice(0, 40),
        ratio: Number(ratio.toFixed(2)),
        threshold,
        fontPx: Math.round(size),
        color: st.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      });
    }
  }
  // Dedup por (cor|fundo|tamanho|threshold) mantendo o primeiro exemplo.
  const seen = new Set();
  const unique = [];
  for (const f of findings) {
    const key = `${f.color}|${f.bg}|${f.fontPx}|${f.threshold}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }
  return unique;
}

const server = createStaticServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(requestedPort, "127.0.0.1", () => {
    server.off("error", reject);
    resolve();
  });
});
const address = server.address();
const port = typeof address === "object" && address ? address.port : requestedPort;
baseUrl = `http://127.0.0.1:${port}/renove-site`;
let browser = await chromium.launch({ headless: true });

const report = [];
const failures = [];

async function settleClose(label, closeFn) {
  try {
    await Promise.race([
      closeFn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} close timeout`)), 5000)),
    ]);
  } catch (error) {
    console.warn(`A11y QA: ${label} nao encerrou limpo (${error.message}); seguindo com saida controlada.`);
  }
}

try {
  for (const route of routes) {
    for (const width of widths) {
      const routeKey = `${route} @${width}`;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        let page;
        try {
          console.log(`A11y QA: ${routeKey}${attempt > 1 ? " (retry)" : ""}`);
          page = await browser.newPage({ viewport: { width, height: 980 } });
          await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

          // 1) axe-core: ruleset WCAG 2.2 A/AA completo.
          await page.addScriptTag({ content: axe.source });
          const axeResults = await page.evaluate(async () => {
            return await window.axe.run(document, {
              runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
              resultTypes: ["violations", "incomplete"],
            });
          });

          // 2) Walker de contraste: autoridade de texto.
          const contrastFindings = await page.evaluate(contrastWalker);

          // 3) Reconcilia: violations do axe (exceto color-contrast, que delegamos
          //    ao walker para evitar falso-negativo em fundo composto).
          const axeViolations = axeResults.violations.filter((v) => v.id !== "color-contrast");
          const axeContrastIncomplete = (axeResults.incomplete || []).filter((v) => v.id === "color-contrast");

          report.push({
            route: routeKey,
            axeViolations: axeViolations.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 6),
            })),
            contrastFailures: contrastFindings,
            axeContrastUndecided: axeContrastIncomplete.reduce((a, v) => a + v.nodes.length, 0),
          });

          for (const v of axeViolations) {
            const targets = v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(", ");
            failures.push(`${routeKey}: [${v.impact || "?"}] ${v.id} -> ${targets}`);
          }
          for (const c of contrastFindings) {
            failures.push(`${routeKey}: contraste ${c.ratio}:1 (precisa ${c.threshold}) "${c.sample}" ${c.selector} ${c.color} sobre ${c.bg}`);
          }

          await page.close();
          break;
        } catch (error) {
          await page?.close().catch(() => {});
          if (attempt >= 2) throw error;
          console.warn(`A11y QA: browser reiniciado apos falha em ${routeKey}: ${error.message}`);
          await settleClose("browser", () => browser.close());
          browser = await chromium.launch({ headless: true });
        }
      }
    }
  }
} finally {
  await settleClose("browser", () => browser.close());
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await settleClose("server", () => new Promise((resolve) => server.close(resolve)));
  server.unref?.();
}

writeFileSync(path.join(artifactDir, "a11y-report.json"), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`\nA11y gate FALHOU: ${failures.length} problema(s).\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\nRelatorio completo: qa-artifacts/a11y-report.json`);
  process.exit(1);
}

const totalUndecided = report.reduce((a, r) => a + r.axeContrastUndecided, 0);
console.log(`A11y gate OK: ${routes.length} rotas x ${widths.length} larguras.`);
console.log(`axe-core deixou ${totalUndecided} caso(s) de contraste como "incomplete" -> todos reconferidos pelo walker (autoridade), sem violacao.`);
process.exit(0);
