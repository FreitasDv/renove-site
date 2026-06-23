import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.resolve(root, "../../renove-os/package.json"));
const { chromium } = req("playwright");
const sites = [
  ["calibrate", "https://www.joincalibrate.com/"],
  ["foundhealth", "https://www.joinfound.com/"],
  ["sequence", "https://www.weightwatchers.com/us/clinic"],
  ["parsley", "https://www.parsleyhealth.com/"],
  ["maven", "https://www.mavenclinic.com/"],
];
const b = await chromium.launch();
for (const [name, url] of sites) {
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await p.goto(url, { waitUntil: "networkidle", timeout: 25000 });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `_refs/${name}.png` });
    console.log(`OK  ${name}`);
    await p.close();
  } catch (e) { console.log(`ERR ${name}: ${String(e).slice(0,80)}`); }
}
await b.close();
