import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = req("playwright");
const port = Number(process.env.SHOT_PORT ?? 4250);
const baseUrl = `http://127.0.0.1:${port}`;
const server = createStaticServer();
await new Promise(r => server.listen(port, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });

const routes = [
  ["/", "home"],
  ["/emagrecimento-bauru/", "emag"],
  ["/harmonizacao-facial-bauru/", "harmo"],
  ["/sobre/", "sobre"],
  ["/contato/", "contato"],
  ["/blog/", "blog"],
  ["/blog/creatina-no-emagrecimento/", "blog-creatina"],
  ["/blog/dieta-ou-acompanhamento-medico/", "blog-dieta"],
  ["/blog/emagrecimento-saudavel-bauru/", "blog-emag"],
  ["/politica-de-privacidade/", "privacidade"],
];
const widths = [390, 768, 1280, 1600];

const report = {};
try {
  for (const [route, slug] of routes) {
    for (const w of widths) {
      const page = await browser.newPage({ viewport: { width: w, height: 1000 } });
      const consoleErr = [];
      page.on("console", m => { if (m.type() === "error") consoleErr.push(m.text().slice(0,120)); });
      const bad404 = [];
      page.on("response", r => { if (r.status() >= 400) bad404.push(r.status()+" "+r.url().split("/").pop()); });
      await page.goto(baseUrl + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);

      const data = await page.evaluate(() => {
        const vw = window.innerWidth;
        const res = { overflowX:false, scrollW:0, clientW:0, edge:[], broken:[], emptyBig:[], tinyTap:[] };
        res.scrollW = document.documentElement.scrollWidth;
        res.clientW = document.documentElement.clientWidth;
        res.overflowX = res.scrollW > res.clientW + 1;
        // imagens quebradas
        document.querySelectorAll("img").forEach(img => {
          if (img.complete && img.naturalWidth === 0) res.broken.push(img.getAttribute("src")||img.getAttribute("alt")||"?");
        });
        // texto colado na borda (<10px)
        const seen = new Set();
        document.querySelectorAll("p,h1,h2,h3,li,a.button,.eyebrow,.lead,blockquote").forEach(el => {
          if (!el.textContent.trim()) return;
          const r = el.getBoundingClientRect();
          if (r.width < 30 || r.height < 8) return;
          const lg = Math.round(r.left), rg = Math.round(vw - r.right);
          if (lg < 10 || rg < 10) {
            const k = el.textContent.trim().slice(0,20)+lg+rg;
            if (!seen.has(k)) { seen.add(k); res.edge.push({lg,rg,t:el.textContent.trim().slice(0,30)}); }
          }
        });
        // tap targets pequenos (links/botoes < 40px altura) no mobile
        if (vw <= 480) {
          document.querySelectorAll("a.button, button, .nav a, footer a").forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.height > 0 && r.height < 36 && el.textContent.trim()) res.tinyTap.push({h:Math.round(r.height), t:el.textContent.trim().slice(0,20)});
          });
        }
        return res;
      });
      const key = `${slug}@${w}`;
      const issues = [];
      if (data.overflowX) issues.push(`SCROLL-X (${data.scrollW}>${data.clientW})`);
      if (data.broken.length) issues.push(`IMG QUEBRADA: ${data.broken.join(", ")}`);
      if (data.edge.length) issues.push(`COLADO BORDA x${data.edge.length}: ${data.edge.slice(0,3).map(e=>`"${e.t}"(l${e.lg}/r${e.rg})`).join(" ")}`);
      if (data.tinyTap.length) issues.push(`TAP<36px x${data.tinyTap.length}: ${data.tinyTap.slice(0,3).map(e=>`"${e.t}"(${e.h}px)`).join(" ")}`);
      if (bad404.length) issues.push(`HTTP>=400: ${[...new Set(bad404)].join(", ")}`);
      if (consoleErr.length) issues.push(`CONSOLE-ERR x${consoleErr.length}: ${consoleErr[0]}`);
      if (issues.length) report[key] = issues;
      await page.close();
    }
  }
  console.log("=== AUDITORIA DOM (so rotas/larguras COM problema) ===");
  const keys = Object.keys(report);
  if (!keys.length) console.log("NENHUM defeito objetivo de DOM encontrado em 10 rotas x 4 larguras.");
  for (const k of keys) { console.log("\n["+k+"]"); report[k].forEach(i=>console.log("  - "+i)); }
} finally {
  await browser.close();
  server.close();
}
