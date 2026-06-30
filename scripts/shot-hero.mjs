import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = req("playwright");
const port = 4255, baseUrl = `http://127.0.0.1:${port}/renove-site`;
const server = createStaticServer();
await new Promise(r => server.listen(port, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });
for (const w of [2560, 768]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(`${baseUrl}/emagrecimento-bauru/index.html`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(root, `qa-artifacts/hero-${w}.png`) });
  await page.close();
  console.log(`hero-${w}`);
}
await browser.close(); server.close(); console.log("done");
