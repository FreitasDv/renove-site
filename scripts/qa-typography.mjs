/**
 * qa-typography.mjs — gate de DISCIPLINA TIPOGRAFICA (medida de linha + orfaos).
 *
 * Nasce de medicao real (2026-06-28): a dor do Joao "quebras de texto e linhas
 * do ultrawide ao celular". No estado atual o site ja esta limpo (0 achados em
 * 5 paginas x 6 breakpoints), entao este gate BLINDA contra regressao futura:
 *
 *   - LINHA LONGA: paragrafo de conteudo (p / .hero-lead / .lead) cuja medida
 *     media de linha passa de MAX_CH caracteres (leitura cansa > ~75ch).
 *   - TITULO SEM BALANCE: H1/H2 que quebra em 2+ linhas sem `text-wrap: balance`
 *     (risco de orfao — 1 palavra solta na ultima linha).
 *
 * Exit 1 se aparecer qualquer achado novo. Calibravel via env.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const req = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = req("playwright");

const ROUTES = [
  "/",
  "/emagrecimento-bauru/",
  "/harmonizacao-facial-bauru/",
  "/sobre/",
  "/contato/",
];
const WIDTHS = [390, 768, 1024, 1280, 1600, 2560];
const MAX_CH = Number(process.env.RENOVE_TYPO_MAXCH || 74);

const srv = createStaticServer();
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await chromium.launch({ headless: true });
const findings = [];

try {
  for (const route of ROUTES) {
    for (const w of WIDTHS) {
      const ctx = await b.newContext({ viewport: { width: w, height: 1080 } });
      const page = await ctx.newPage();
      try {
        await page.goto(base + route, { waitUntil: "networkidle", timeout: 20000 });
      } catch {
        await ctx.close();
        continue;
      }
      await page.addStyleTag({ content: "[data-reveal]{opacity:1!important;transform:none!important;}" });
      await page.waitForTimeout(200);
      const bad = await page.evaluate((MAX_CH) => {
        const out = [];
        const els = [...document.querySelectorAll("h1, h2, .hero-lead, .section-heading p, .lead")];
        for (const el of els) {
          const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
          if (txt.length < 12) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 20 || r.height < 8) continue;
          const cs = getComputedStyle(el);
          const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
          const lines = Math.max(1, Math.round(r.height / lh));
          const tag = el.tagName.toLowerCase() +
            (el.className ? "." + el.className.toString().split(" ").filter(Boolean).slice(0, 2).join(".") : "");
          const isPara = el.tagName === "P" || el.classList.contains("hero-lead") || el.classList.contains("lead");
          if (isPara && lines >= 2) {
            const charsPerLine = txt.length / lines;
            if (charsPerLine > MAX_CH)
              out.push({ tag, issue: "linha-longa", chars: Math.round(charsPerLine), lines, txt: txt.slice(0, 44) });
          }
          if (el.tagName === "H1" || el.tagName === "H2") {
            if (lines >= 2 && cs.textWrap !== "balance" && cs.textWrapStyle !== "balance")
              out.push({ tag, issue: "titulo-sem-balance", lines, txt: txt.slice(0, 44) });
          }
        }
        return out;
      }, MAX_CH);
      for (const f of bad) findings.push({ route, w, ...f });
      const mark = bad.length ? "x" : ".";
      process.stdout.write(`${mark} ${route}@${w} (${bad.length})\n`);
      await ctx.close();
    }
  }
} finally {
  await b.close();
  srv.close();
}

mkdirSync(path.join(root, "qa-artifacts"), { recursive: true });
writeFileSync(path.join(root, "qa-artifacts", "qa-typography.json"), JSON.stringify({ findings }, null, 2));

if (findings.length) {
  const byKey = {};
  for (const f of findings) {
    const k = `${f.issue} ${f.tag} :: "${f.txt}"`;
    (byKey[k] = byKey[k] || []).push(f.w);
  }
  console.error(`\nFALHAS TYPOGRAPHY (${findings.length}):`);
  for (const [k, ws] of Object.entries(byKey))
    console.error(`- [${[...new Set(ws)].join(",")}] ${k}`);
  process.exit(1);
}
console.log("\nqa:typography OK — medida de linha e balance de titulos saudaveis.");
