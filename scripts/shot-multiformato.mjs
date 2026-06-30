/**
 * shot-multiformato.mjs — captura cada pagina do site em devices REAIS
 * (emulacao de device do Playwright: viewport + DPR + userAgent + touch)
 * mais ultrawide. Gera viewport-crop E full-page para QA visual humano/IA.
 *
 * Saida: qa-artifacts/mf/<rota>__<device>.png (viewport) e ...__<device>-full.png
 *
 * Uso: node scripts/shot-multiformato.mjs [--full-only] [--routes home,ferramentas]
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium, devices } = requireFromRenoveOs("playwright");

const ROUTES = {
  home: "/",
  emagrecimento: "/emagrecimento-bauru/",
  harmonizacao: "/harmonizacao-facial-bauru/",
  ferramentas: "/ferramentas/",
  sobre: "/sobre/",
  contato: "/contato/",
  blog: "/blog/",
  "blog-post": "/blog/creatina-no-emagrecimento/",
};

// Matriz multiformato: nome curto -> descriptor real ou viewport custom
const FORMATS = [
  { id: "iphone-se", device: "iPhone SE" },              // mobile pequeno 375
  { id: "iphone15", device: "iPhone 15" },               // mobile padrao
  { id: "iphone15-promax", device: "iPhone 15 Pro Max" },// mobile grande
  { id: "galaxy-s24", device: "Galaxy S24" },            // android
  { id: "ipad-mini", device: "iPad Mini" },              // tablet retrato
  { id: "ipad-pro11", device: "iPad Pro 11" },           // tablet grande
  { id: "ipad-pro11-land", device: "iPad Pro 11 landscape" }, // tablet paisagem
  { id: "laptop", viewport: { width: 1366, height: 820 }, dpr: 1 },   // notebook comum
  { id: "desktop", viewport: { width: 1920, height: 1080 }, dpr: 1 }, // fhd
  { id: "ultrawide", viewport: { width: 2560, height: 1080 }, dpr: 1 },// uw
];

const args = process.argv.slice(2);
const fullOnly = args.includes("--full-only");
const routeArg = args.find((a) => a.startsWith("--routes"));
const onlyRoutes = routeArg ? routeArg.split("=")[1]?.split(",") : null;

const outDir = path.join(root, "qa-artifacts", "mf");
mkdirSync(outDir, { recursive: true });

const { server, baseUrl } = await new Promise((resolve, reject) => {
  const srv = createStaticServer();
  srv.once("error", reject);
  srv.listen(0, "127.0.0.1", () => {
    const addr = srv.address();
    resolve({ server: srv, baseUrl: `http://127.0.0.1:${addr.port}` });
  });
});

const browser = await chromium.launch();
let shots = 0;
const manifest = [];
try {
  const routeEntries = Object.entries(ROUTES).filter(
    ([k]) => !onlyRoutes || onlyRoutes.includes(k)
  );
  for (const [routeName, routePath] of routeEntries) {
    for (const fmt of FORMATS) {
      const ctxOpts = fmt.device
        ? { ...devices[fmt.device] }
        : { viewport: fmt.viewport, deviceScaleFactor: fmt.dpr ?? 1 };
      const context = await browser.newContext(ctxOpts);
      const page = await context.newPage();
      await page.goto(baseUrl + routePath, { waitUntil: "networkidle", timeout: 30000 });
      // deixa animacoes assentarem
      await page.waitForTimeout(700);

      if (!fullOnly) {
        const vp = path.join(outDir, `${routeName}__${fmt.id}.png`);
        await page.screenshot({ path: vp });
        manifest.push({ route: routeName, format: fmt.id, kind: "viewport", file: vp });
        shots++;
      }
      const full = path.join(outDir, `${routeName}__${fmt.id}-full.png`);
      await page.screenshot({ path: full, fullPage: true });
      manifest.push({ route: routeName, format: fmt.id, kind: "full", file: full });
      shots++;

      await context.close();
      process.stdout.write(`. ${routeName}/${fmt.id}\n`);
    }
  }
} finally {
  await browser.close();
  server.closeAllConnections?.();
  await new Promise((r) => server.close(r));
}

console.log(`\nOK shots=${shots} dir=${outDir}`);
