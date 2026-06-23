import { createRequire } from "node:module";
const req = createRequire("C:/Users/creat/OneDrive/Desktop/PRODUÇÃO IA RENOVE/tools/renove-atlas-site/package.json");
let chromium;
try { ({ chromium } = req("playwright")); }
catch { ({ chromium } = req("playwright-core")); }
const out = "C:/Users/creat/bvshots";
const pages = [
  ["home", "http://127.0.0.1:4187/"],
  ["emag", "http://127.0.0.1:4187/emagrecimento-bauru/"],
];
const b = await chromium.launch();
for (const [name, url] of pages) {
  for (const [vp, w, h] of [["desk",1440,900],["mob",390,844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${out}/before-${name}-${vp}.png`, fullPage: vp==="desk" });
    await p.close();
    console.log(`OK ${name}-${vp}`);
  }
}
await b.close();
