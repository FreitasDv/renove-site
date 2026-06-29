/* ============================================================
   QA BALANCE GATE — SPEC_SISTEMA_DESIGN_R9 (LEI DOS 5 BREAKPOINTS / equilibrio).
   Mata a dor cronica "puxa tudo pra esquerda, direita fica vazia" no
   desktop largo e ultrawide. Mede a ASSIMETRIA esquerda/direita do
   conteudo dentro de cada secao full-bleed e de cada hero.

   Como mede (robusto contra falso positivo):
     - Para cada secao full-bleed (largura ~= viewport), monta o
       ENVELOPE do conteudo real: rects de h1-h4, p, img, svg, ul/ol,
       form, button, a.button, .card, picture, video, table.
     - IGNORA decorativos posicionados (folha/botanical/blob/orb/veu/
       ::before) — eles nao contam como conteudo, sao fundo.
     - gapEsq = envelopeLeft - secaoLeft ; gapDir = secaoRight - envelopeRight.
     - diff = |gapEsq - gapDir| ; diffPct = diff / larguraSecao * 100.

   Calibragem (evita barulho bobo):
     - So avalia secao com largura >= 1280px (faz sentido em desktop largo).
     - So avalia se ha espaco livre real (envelope < 97% da secao); se o
       conteudo ja preenche a secao, nao ha o que equilibrar -> pula.
     - Reporta quando diffPct > LIMIAR (default 8%).
     - Default: WARNING (nao bloqueia). RENOVE_BALANCE_STRICT=1 -> FAIL (exit 1).

   Saida por achado: rota, viewport, secao, gapEsq, gapDir, diff, diffPct.
   ============================================================ */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");

const port = Number(process.env.RENOVE_ATLAS_QA_PORT ?? 4200);
const baseUrl = `http://127.0.0.1:${port}`;
const strict = process.env.RENOVE_BALANCE_STRICT === "1";
const LIMIAR = Number(process.env.RENOVE_BALANCE_THRESHOLD ?? 8); // % de assimetria
const MIN_SECTION_W = 1280; // so avalia secao larga o suficiente

const routes = [
  ["/", "home"],
  ["/emagrecimento-bauru/", "emagrecimento-bauru"],
  ["/harmonizacao-facial-bauru/", "harmonizacao-facial-bauru"],
  ["/sobre/", "sobre"],
  ["/contato/", "contato"],
];
const widths = [1440, 1920, 2560];

const server = createStaticServer();
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });

const failures = [];
const warnings = [];

try {
  for (const [route, slug] of routes) {
    for (const w of widths) {
      const page = await browser.newPage({ viewport: { width: w, height: 1080 } });
      await page.goto(baseUrl + route, { waitUntil: "networkidle" });
      // garante que reveals nao escondam conteudo na medicao
      await page.addStyleTag({ content: "[data-reveal]{opacity:1 !important;transform:none !important;}" });
      await page.waitForTimeout(200);

      const findings = await page.evaluate(({ minW, limiar }) => {
        const out = [];
        const vw = window.innerWidth;
        const DECOR = /(leaf|botanic|blob|orb|veil|veu|glow|halo|particle|decor|aura)/i;
        const CONTENT_SEL = "h1,h2,h3,h4,p,img,svg,ul,ol,form,button,a.button,a.btn,.button,.btn,.card,picture,video,table,figure";

        const isDecor = (el) => {
          const cls = (el.className || "").toString();
          if (DECOR.test(cls)) return true;
          const cs = getComputedStyle(el);
          // decorativo posicionado fora do fluxo nao conta como conteudo
          if ((cs.position === "absolute" || cs.position === "fixed") && (DECOR.test(cls) || el.getAttribute("aria-hidden") === "true")) return true;
          return false;
        };
        const visible = (el) => {
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
          const r = el.getBoundingClientRect();
          return r.width > 20 && r.height > 8;
        };

        // secoes full-bleed (cobrem a largura da viewport).
        // EXCLUI header/footer/nav: tem layout proprio (logo+menu), nao
        // sao secoes de conteudo a equilibrar -> evita falso positivo.
        const sections = Array.from(document.querySelectorAll("section, .hero, main > div"))
          .filter((el) => !el.closest("header, footer, nav, .site-header, .site-footer"));
        const seen = new Set();
        for (const sec of sections) {
          const sr = sec.getBoundingClientRect();
          if (sr.width < minW) continue;
          if (sr.width < vw - 4) continue; // nao e full-bleed
          // monta envelope do conteudo real
          let minL = Infinity, maxR = -Infinity, count = 0;
          for (const el of sec.querySelectorAll(CONTENT_SEL)) {
            if (isDecor(el) || !visible(el)) continue;
            // ignora elementos que sao a propria secao filha full-bleed (evita auto-contar wrappers)
            const r = el.getBoundingClientRect();
            if (r.width >= sr.width - 2) continue; // wrapper de largura total, nao conta como "conteudo posicionado"
            if (r.left < minL) minL = r.left;
            if (r.right > maxR) maxR = r.right;
            count++;
          }
          if (count < 1 || !isFinite(minL) || !isFinite(maxR)) continue;
          const envW = maxR - minL;
          if (envW >= sr.width * 0.97) continue; // conteudo ja preenche -> nada a equilibrar
          const gapEsq = Math.max(0, Math.round(minL - sr.left));
          const gapDir = Math.max(0, Math.round(sr.right - maxR));
          const diff = Math.abs(gapEsq - gapDir);
          const diffPct = +(diff / sr.width * 100).toFixed(1);
          if (diffPct <= limiar) continue;
          const cls = (sec.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join(".") || sec.tagName.toLowerCase();
          const key = cls + "|" + gapEsq + "|" + gapDir;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ sec: cls, gapEsq, gapDir, diff, diffPct, side: gapDir > gapEsq ? "direita-vazia" : "esquerda-vazia" });
        }
        return out;
      }, { minW: MIN_SECTION_W, limiar: LIMIAR });

      for (const f of findings) {
        const msg = `${slug}@${w} — secao .${f.sec}: ${f.side} (gapEsq ${f.gapEsq}px | gapDir ${f.gapDir}px | diff ${f.diff}px = ${f.diffPct}%)`;
        if (strict) failures.push(msg);
        else warnings.push(msg);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (warnings.length) {
  console.warn(`Balance QA — ${warnings.length} aviso(s) de assimetria (nao bloqueante; RENOVE_BALANCE_STRICT=1 p/ bloquear, limiar ${LIMIAR}%):`);
  for (const w of warnings) console.warn("  ~ " + w);
}

if (failures.length) {
  console.error(`Balance QA FAILED — ${failures.length} secao(oes) desequilibrada(s) (limiar ${LIMIAR}%):`);
  for (const f of failures) console.error("- " + f);
  process.exit(1);
} else if (!warnings.length) {
  console.log(`Balance QA passed: ${routes.length} rotas × ${widths.length} viewports (1440/1920/2560), assimetria E×D <= ${LIMIAR}% em todas as secoes full-bleed.`);
} else {
  console.log(`Balance QA: ${warnings.length} aviso(s) acima — calibravel via RENOVE_BALANCE_THRESHOLD (atual ${LIMIAR}).`);
}
