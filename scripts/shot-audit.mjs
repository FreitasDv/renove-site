import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = req("playwright");
const port = 4277, baseUrl = `http://127.0.0.1:${port}`;
const server = createStaticServer();
await new Promise(r => server.listen(port, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });
const targets = [
  { url: "/index.html", sel: ".split-section", tag: "services" },
  { url: "/index.html", sel: ".care-section", tag: "care" },
  { url: "/index.html", sel: ".proof-section", tag: "proof-home" },
  { url: "/emagrecimento-bauru/index.html", sel: ".testimonials-grid", tag: "testi" },
];
for (const w of [1440, 390]) {
  for (const t of targets) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(`${baseUrl}${t.url}`, { waitUntil: "networkidle" });
    const el = await page.$(t.sel);
    if (el) { await el.screenshot({ path: path.join(root, `qa-artifacts/aud-${t.tag}-${w}.png`) }); console.log(`aud-${t.tag}-${w}`); }
    else console.log(`MISS ${t.sel} @ ${t.url}`);
    await page.close();
  }
}
await browser.close(); server.close(); console.log("done");
