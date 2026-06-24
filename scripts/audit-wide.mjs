import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = req("playwright");
const port = Number(process.env.SHOT_PORT ?? 4256);
const baseUrl = `http://127.0.0.1:${port}`;
const server = createStaticServer();
await new Promise(r => server.listen(port, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });

const routes = [
  ["/", "home"], ["/emagrecimento-bauru/", "emag"], ["/harmonizacao-facial-bauru/", "harmo"],
  ["/sobre/", "sobre"], ["/contato/", "contato"], ["/blog/", "blog"],
];
const widths = [2560, 1920];
const report = {};
for (const [route, slug] of routes) {
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 1080 } });
    await page.goto(baseUrl + route, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "[data-reveal]{opacity:1 !important;transform:none !important;}" });
    await page.waitForTimeout(200);
    const data = await page.evaluate(() => {
      const vw = window.innerWidth;
      const res = { overflowX:false, scrollW:document.documentElement.scrollWidth, clientW:document.documentElement.clientWidth, wideText:[], wideContainer:[], hugeGap:[] };
      res.overflowX = res.scrollW > res.clientW + 1;
      // 1) linhas de texto longas demais (> 90ch ~ ruim pra leitura). mede largura real do paragrafo
      const seenT = new Set();
      document.querySelectorAll("p, .lead, li").forEach(el => {
        const t = el.textContent.trim();
        if (t.length < 60) return;
        const r = el.getBoundingClientRect();
        if (r.width < 100) return;
        // estima ch: largura / (fontSize*0.5)
        const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
        const ch = Math.round(r.width / (fs * 0.5));
        if (ch > 95) {
          const k = t.slice(0,18);
          if (!seenT.has(k)) { seenT.add(k); res.wideText.push({ch, w:Math.round(r.width), t:t.slice(0,32)}); }
        }
      });
      // 2) containers de secao que ocupam quase toda a tela larga (sem max-width)
      document.querySelectorAll("section, .container, main > div, .wrap, .inner").forEach(el => {
        const r = el.getBoundingClientRect();
        // conteudo de texto direto, largura > 1500px = provavel falta de max-width
        if (r.width > 1500 && el.querySelector("p,h2,h3")) {
          const cls = (el.className||"").toString().slice(0,30) || el.tagName.toLowerCase();
          res.wideContainer.push({w:Math.round(r.width), cls});
        }
      });
      // dedup containers
      res.wideContainer = res.wideContainer.filter((v,i,a)=>a.findIndex(x=>x.cls===v.cls)===i).slice(0,5);
      return res;
    });
    const key = `${slug}@${w}`;
    const issues = [];
    if (data.overflowX) issues.push(`SCROLL-X (${data.scrollW}>${data.clientW})`);
    if (data.wideText.length) issues.push(`LINHA-LONGA x${data.wideText.length}: ${data.wideText.slice(0,2).map(e=>`${e.ch}ch/${e.w}px "${e.t}"`).join(" | ")}`);
    if (data.wideContainer.length) issues.push(`CONTAINER-LARGO: ${data.wideContainer.map(e=>`${e.cls}(${e.w}px)`).join(", ")}`);
    if (issues.length) report[key] = issues;
    await page.close();
  }
}
await browser.close();
server.close();
console.log(JSON.stringify(report, null, 2));
const n = Object.keys(report).length;
console.log(n ? `\n>>> ${n} viewports com sinais a investigar` : "\n>>> LIMPO em ultrawide/desktop grande");
