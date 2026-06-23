import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");

const routes = [["/index.html", "home"], ["/emagrecimento-bauru/index.html", "lp"], ["/sobre/index.html", "sobre"]];
const widths = [1920, 1440];
const port = 4244;
const baseUrl = `http://127.0.0.1:${port}`;

const server = createStaticServer();
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const browser = await chromium.launch({ headless: true });
for (const [r, name] of routes) {
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}${r}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(root, `qa-artifacts/uw-${name}-${w}.png`), fullPage: true });
    await page.close();
    console.log(`shot uw-${name}-${w}`);
  }
}
await browser.close();
server.close();
console.log("done");
