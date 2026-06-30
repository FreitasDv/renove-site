/**
 * qa-lighthouse.mjs — auditoria Lighthouse multiformato (mobile + desktop)
 * em cada pagina. Reaproveita o lighthouse instalado em ../renove-os.
 * Falha (exit 1) se qualquer categoria ficar abaixo do minimo definido.
 *
 * Categorias: performance, accessibility, best-practices, seo.
 * Saida JSON resumida: qa-artifacts/lighthouse-summary.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");
const lighthouse = (await import(
  requireFromRenoveOs.resolve("lighthouse/core/index.js")
)).default;

const ROUTES = {
  home: "/",
  emagrecimento: "/emagrecimento-bauru/",
  ferramentas: "/ferramentas/",
  blog: "/blog/",
};

// Minimos por categoria (0-100). Ajustaveis conforme o site amadurece.
const MIN = { performance: 80, accessibility: 95, "best-practices": 90, seo: 95 };

const FORMS = [
  { id: "mobile", formFactor: "mobile", width: 412, height: 823, mobile: true },
  { id: "desktop", formFactor: "desktop", width: 1920, height: 1080, mobile: false },
];

const outDir = path.join(root, "qa-artifacts");
mkdirSync(outDir, { recursive: true });

const { server, port } = await new Promise((resolve, reject) => {
  const srv = createStaticServer();
  srv.once("error", reject);
  srv.listen(0, "127.0.0.1", () => resolve({ server: srv, port: srv.address().port }));
});
const baseUrl = `http://127.0.0.1:${port}/renove-site`;

const browser = await chromium.launch({ args: ["--remote-debugging-port=9222"] });
const summary = [];
const failures = [];
try {
  for (const [routeName, routePath] of Object.entries(ROUTES)) {
    for (const fm of FORMS) {
      const result = await lighthouse(
        baseUrl + routePath,
        {
          port: 9222,
          output: "json",
          logLevel: "error",
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          formFactor: fm.formFactor,
          screenEmulation: {
            mobile: fm.mobile,
            width: fm.width,
            height: fm.height,
            deviceScaleFactor: fm.mobile ? 2.6 : 1,
            disabled: false,
          },
        }
      );
      const cats = result.lhr.categories;
      const row = { route: routeName, format: fm.id };
      for (const [k, v] of Object.entries(cats)) {
        const score = Math.round((v.score ?? 0) * 100);
        row[k] = score;
        if (MIN[k] != null && score < MIN[k]) {
          failures.push(`${routeName}/${fm.id}: ${k}=${score} (<${MIN[k]})`);
        }
      }
      summary.push(row);
      process.stdout.write(
        `${routeName}/${fm.id}: perf ${row.performance} a11y ${row.accessibility} bp ${row["best-practices"]} seo ${row.seo}\n`
      );
    }
  }
} finally {
  await browser.close();
  server.closeAllConnections?.();
  await new Promise((r) => server.close(r));
}

writeFileSync(path.join(outDir, "lighthouse-summary.json"), JSON.stringify({ summary, failures }, null, 2));
if (failures.length) {
  console.error("\nFALHAS LIGHTHOUSE:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("\nLighthouse OK — todas as paginas acima do minimo.");
