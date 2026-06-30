/* ============================================================
   QA DEPTH GATE — SPEC_SISTEMA_DESIGN_R9 §2/§7.
   Falha se alguma seção full-bleed renderizar com cor de fundo
   SÓLIDA sem nenhuma profundidade (gradiente/véu via background-image
   ou pseudo-elemento ::before/::after com background).
   "Full-bleed" aqui = section/div de seção que ocupa a largura do
   conteúdo e tem cor de fundo não-transparente.
   ============================================================ */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");

const requestedPort = Number(process.env.RENOVE_ATLAS_QA_PORT ?? 0);
let baseUrl;
const routes = [
  "/",
  "/emagrecimento-bauru/",
  "/harmonizacao-facial-bauru/",
  "/ferramentas/",
  "/sobre/",
  "/contato/",
  "/blog/",
];

// Cores de marca consideradas "andar" (precisam de profundidade quando full-bleed).
// transparent/branco-papel puro de leitura não exigem véu.
const SOLID_BRAND = new Set([
  "rgb(16, 42, 61)", // deep-blue
  "rgb(41, 108, 123)", // petrol
  "rgb(35, 100, 140)", // ocean
  "rgb(207, 224, 221)", // glacier
  "rgb(236, 224, 210)", // sand
  "rgb(226, 237, 234)", // glacier-soft
]);

const server = createStaticServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(requestedPort, "127.0.0.1", () => {
    server.off("error", reject);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : requestedPort;
    baseUrl = `http://127.0.0.1:${port}`;
    resolve();
  });
});
const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    const flats = await page.evaluate((solidList) => {
      const solid = new Set(solidList);
      const out = [];
      const candidates = document.querySelectorAll(
        "main > section, main > div, .home-method, .care-section, .proof-section, .cta-section, .qualifier-section, .investment-section"
      );
      for (const el of candidates) {
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        if (!solid.has(bg)) continue; // só cobra dos andares de marca
        const rect = el.getBoundingClientRect();
        if (rect.width < window.innerWidth * 0.6 || rect.height < 200) continue; // só full-bleed grandes
        const hasOwnGrad = cs.backgroundImage && cs.backgroundImage !== "none";
        const before = getComputedStyle(el, "::before");
        const after = getComputedStyle(el, "::after");
        const hasPseudoDepth =
          (before.content !== "none" && (before.backgroundImage !== "none" || before.background.includes("gradient"))) ||
          (after.content !== "none" && (after.backgroundImage !== "none" || after.background.includes("gradient")));
        // folha botânica filha conta como profundidade
        const hasLeaf = el.querySelector(".botanical, .leaf, [class*='leaf']") !== null;
        if (!hasOwnGrad && !hasPseudoDepth && !hasLeaf) {
          out.push({ cls: el.className.split(" ").slice(0, 2).join("."), bg });
        }
      }
      return out;
    }, [...SOLID_BRAND]);
    for (const f of flats) {
      failures.push(`${route} — seção chapada sem profundidade: .${f.cls} (${f.bg})`);
    }
    await page.close();
  }
} finally {
  await browser.close().catch(() => {});
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error("Depth QA FAILED:");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
} else {
  console.log(`Depth QA passed: ${routes.length} rotas, nenhuma seção de marca chapada sem profundidade.`);
}
