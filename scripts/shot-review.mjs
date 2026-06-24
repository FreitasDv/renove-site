import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = req("playwright");
const port = 4321, baseUrl = `http://127.0.0.1:${port}`;
const server = createStaticServer();
await new Promise(r => server.listen(port, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });

const routes = [
  ["/index.html", "home"],
  ["/emagrecimento-bauru/index.html", "emag"],
  ["/harmonizacao-facial-bauru/index.html", "harmo"],
  ["/sobre/index.html", "sobre"],
  ["/contato/index.html", "contato"],
  ["/blog/index.html", "blog"],
  ["/blog/creatina-no-emagrecimento/index.html", "blog-creatina"],
  ["/blog/dieta-ou-acompanhamento-medico/index.html", "blog-dieta"],
  ["/blog/emagrecimento-saudavel-bauru/index.html", "blog-emag"],
  ["/politica-de-privacidade/index.html", "privacidade"],
  ["/brief/index.html", "brief"],
];
const widths = [390, 1440, 2560];

for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 1 });
  for (const [route, alias] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(root, `qa-artifacts/rev-${alias}-${w}.png`), fullPage: true });
    console.log(`rev-${alias}-${w}`);
  }
  await page.close();
}
await browser.close(); server.close(); console.log("done");
