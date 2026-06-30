/**
 * qa-grid-align.mjs — gate de ALINHAMENTO DE GRID entre secoes.
 * Nasce de medicao real: na home, titulos de secao comecavam em 5 margens
 * esquerdas diferentes no mesmo viewport (264/120/320/369/879px em 1920),
 * o que o Joao sente como "desalinhado / puxado pra um lado".
 *
 * Regra: num mesmo viewport, as margens esquerdas dos titulos de secao de
 * conteudo devem convergir para POUCOS eixos (tolerancia configuravel).
 * Exit 1 se houver eixos demais (grid inconsistente).
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

const ROUTES = { home: "/", emagrecimento: "/emagrecimento-bauru/", ferramentas: "/ferramentas/" };
const WIDTHS = [1366, 1920, 2560];
const TOL = 24;          // px: margens dentro disso contam como o mesmo eixo
const MAX_AXES = 2;      // hero pode ter eixo proprio; conteudo deve ter 1 (=> 2 no total)

const srv = createStaticServer();
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await chromium.launch();
const failures = [];
const report = [];
try {
  for (const [routeName, routePath] of Object.entries(ROUTES)) {
    for (const w of WIDTHS) {
      const ctx = await b.newContext({ viewport: { width: w, height: 1080 }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.goto(base + routePath, { waitUntil: "networkidle", timeout: 30000 });
      const lefts = await p.evaluate(() => {
        const seen = new Set(); const out = [];
        document.querySelectorAll("section, .home-method, .care-layout, [class*=section]").forEach((s) => {
          const h = s.querySelector("h2, .eyebrow, [class*=eyebrow]");
          if (!h) return;
          const r = h.getBoundingClientRect();
          if (r.width === 0 || r.top < 0) return;
          // ignora headings CENTRADOS: centragem e decisao deliberada, nao
          // desalinhamento. Detecta por text-align dos ancestrais proximos.
          let centered = false;
          for (let el = h; el && el !== document.body; el = el.parentElement) {
            const ta = getComputedStyle(el).textAlign;
            if (ta === "center") { centered = true; break; }
            if (ta === "left" || ta === "start") break;
          }
          if (centered) return;
          // ignora headings dentro de CARDS contidos (borda ou raio):
          // inset deliberado, nao secao full-width.
          const cs = getComputedStyle(s);
          const isCard = parseFloat(cs.borderTopWidth) > 0 || (cs.borderRadius && cs.borderRadius !== "0px");
          if (isCard) return;
          const cls = (s.className || "").toString().slice(0, 24);
          const key = cls + "|" + Math.round(r.left);
          if (seen.has(key)) return; seen.add(key);
          out.push({ sec: cls, left: Math.round(r.left), txt: (h.textContent || "").trim().slice(0, 18) });
        });
        return out;
      });
      // agrupa em eixos por tolerancia
      const axes = [];
      for (const item of lefts.sort((a, c) => a.left - c.left)) {
        const ax = axes.find((a) => Math.abs(a.center - item.left) <= TOL);
        if (ax) { ax.items.push(item); ax.center = Math.round((ax.center * (ax.items.length - 1) + item.left) / ax.items.length); }
        else axes.push({ center: item.left, items: [item] });
      }
      const row = { route: routeName, width: w, axesCount: axes.length, axes: axes.map((a) => ({ center: a.center, n: a.items.length })) };
      report.push(row);
      const ok = axes.length <= MAX_AXES;
      if (!ok) failures.push(`${routeName}@${w}px: ${axes.length} eixos esquerdos (max ${MAX_AXES}) -> ${axes.map((a) => a.center + "px").join(", ")}`);
      process.stdout.write(`${ok ? "." : "x"} ${routeName}@${w} eixos=${axes.length} [${axes.map((a) => a.center).join(",")}]\n`);
      await ctx.close();
    }
  }
} finally {
  await b.close();
  srv.close();
}
mkdirSync(path.join(root, "qa-artifacts"), { recursive: true });
writeFileSync(path.join(root, "qa-artifacts", "qa-grid-align.json"), JSON.stringify({ failures, report }, null, 2));
if (failures.length) {
  console.error(`\nFALHAS GRID-ALIGN (${failures.length}):\n- ` + failures.join("\n- "));
  process.exit(1);
}
console.log("\nqa:grid-align OK — secoes convergem para eixo comum.");
