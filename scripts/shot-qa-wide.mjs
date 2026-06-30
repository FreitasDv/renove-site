import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");

// saida em path ASCII puro (regra do ambiente)
const OUT = "C:/Users/creat/bvshots/renove_qa";
mkdirSync(OUT, { recursive: true });

const routes = [
  ["/index.html", "home"],
  ["/emagrecimento-bauru/index.html", "lp-emag"],
  ["/harmonizacao-facial-bauru/index.html", "hof"],
  ["/sobre/index.html", "sobre"],
  ["/contato/index.html", "contato"],
  ["/blog/index.html", "blog"],
];
// ultrawide + desktop grande + desktop padrao
const widths = [2560, 1920, 1440];
const port = 4255;
const baseUrl = `http://127.0.0.1:${port}/renove-site`;

const server = createStaticServer();
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const browser = await chromium.launch({ headless: true });
for (const [r, name] of routes) {
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 1080 }, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}${r}`, { waitUntil: "networkidle" });
    // forca reveals visiveis pra fullPage nao capturar secoes "vazias"
    await page.addStyleTag({ content: "[data-reveal]{opacity:1 !important;transform:none !important;}" });
    await page.waitForTimeout(250);
    // 1) dobra (proporcao real do que o usuario ve primeiro)
    await page.screenshot({ path: path.join(OUT, `fold-${name}-${w}.png`) });
    // 2) fullPage (layout inteiro)
    await page.screenshot({ path: path.join(OUT, `full-${name}-${w}.png`), fullPage: true });
    await page.close();
    console.log(`shot ${name} @ ${w}`);
  }
}
await browser.close();
server.close();
console.log("done");
