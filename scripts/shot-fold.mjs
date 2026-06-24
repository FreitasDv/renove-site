import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = req("playwright");
const port = 4322, baseUrl = `http://127.0.0.1:${port}`;
const server = createStaticServer();
await new Promise(r => server.listen(port, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });

// viewport-only shots (above the fold) where composition matters
const targets = [
  ["/index.html", "home", 1440, 900],
  ["/index.html", "home", 390, 780],
  ["/emagrecimento-bauru/index.html", "emag", 1440, 900],
  ["/harmonizacao-facial-bauru/index.html", "harmo", 1440, 900],
  ["/sobre/index.html", "sobre", 1440, 900],
  ["/contato/index.html", "contato", 1440, 900],
  ["/blog/index.html", "blog", 1440, 900],
  ["/blog/creatina-no-emagrecimento/index.html", "artigo", 1440, 900],
];
for (const [route, alias, w, h] of targets) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(root, `qa-artifacts/fold-${alias}-${w}.png`) });
  console.log(`fold-${alias}-${w}`);
  await page.close();
}
await browser.close(); server.close(); console.log("done");
