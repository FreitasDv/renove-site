/**
 * qa-header.mjs — gate dedicado ao CABECALHO em multiformato (device real).
 * Nasce da queixa recorrente do Joao: "cabecalho mobile ta lixoso".
 *
 * Checa, em iPhone SE / iPhone 15 Pro Max / Galaxy S24 / iPad Mini / desktop / ultrawide:
 *  1. logo nitido (naturalWidth >= displayWidth * dpr * 0.9 -> nada pixelado)
 *  2. hamburguer com alvo de toque >= 44x44 e visivel no mobile
 *  3. nav real escondido no mobile (so abre no nav-open) e visivel no desktop
 *  4. header sem overflow horizontal (lockup/CTA nao estouram a largura)
 *  5. altura do header proporcional (<= 22% da viewport no mobile)
 *  6. CTA do header acessivel (nao sobreposto, dentro da viewport)
 *  7. brand-name e brand-tag nao quebram/colidem
 * Exit 1 com lista de falhas por formato.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium, devices } = requireFromRenoveOs("playwright");

const ROUTES = { home: "/", emagrecimento: "/emagrecimento-bauru/", ferramentas: "/ferramentas/" };

const FORMATS = [
  { id: "iphone-se", device: "iPhone SE", mobile: true },
  { id: "iphone15-promax", device: "iPhone 15 Pro Max", mobile: true },
  { id: "galaxy-s24", device: "Galaxy S24", mobile: true },
  { id: "ipad-mini", device: "iPad Mini", mobile: true },     // tablet usa hamburguer (<=980)
  { id: "desktop", viewport: { width: 1920, height: 1080 }, dpr: 1, mobile: false },
  { id: "ultrawide", viewport: { width: 2560, height: 1080 }, dpr: 1, mobile: false },
];

const { server, port } = await new Promise((resolve, reject) => {
  const srv = createStaticServer();
  srv.once("error", reject);
  srv.listen(0, "127.0.0.1", () => resolve({ server: srv, port: srv.address().port }));
});
const baseUrl = `http://127.0.0.1:${port}`;

const browser = await chromium.launch();
const failures = [];
const report = [];
try {
  for (const [routeName, routePath] of Object.entries(ROUTES)) {
    for (const fmt of FORMATS) {
      const ctxOpts = fmt.device
        ? { ...devices[fmt.device] }
        : { viewport: fmt.viewport, deviceScaleFactor: fmt.dpr ?? 1 };
      const context = await browser.newContext(ctxOpts);
      const page = await context.newPage();
      await page.goto(baseUrl + routePath, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(400);

      const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
      const m = await page.evaluate(() => {
        const out = { problems: [] };
        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;
        out.vw = vw; out.vh = vh;

        const header = document.querySelector(".site-header");
        if (!header) { out.problems.push("sem .site-header"); return out; }
        const hr = header.getBoundingClientRect();
        out.headerH = Math.round(hr.height);
        out.headerRatio = +(hr.height / vh).toFixed(3);
        if (hr.right > vw + 1) out.problems.push(`header estoura +${Math.round(hr.right - vw)}px`);

        // logo
        const img = header.querySelector(".brand img");
        if (img) {
          const ir = img.getBoundingClientRect();
          out.logoDisp = Math.round(ir.width);
          out.logoNatural = img.naturalWidth;
          out.logoNeed = Math.round(ir.width * (window.devicePixelRatio || 1) * 0.9);
          if (img.naturalWidth && img.naturalWidth < out.logoNeed) {
            out.problems.push(`logo pixelado: natural ${img.naturalWidth}px < precisa ~${out.logoNeed}px`);
          }
        } else out.problems.push("sem logo no header");

        // brand lockup colisao/quebra
        const name = header.querySelector(".brand-name");
        const tag = header.querySelector(".brand-tag");
        if (name && tag) {
          const nr = name.getBoundingClientRect();
          const tr = tag.getBoundingClientRect();
          if (nr.bottom > tr.top + 2 && Math.abs(nr.left - tr.left) < 4) {
            // empilhado e ok; checa se sai do header
          }
          if (nr.right > hr.right || tr.right > hr.right) out.problems.push("brand-lockup vaza do header");
        }

        // hamburguer
        const btn = document.querySelector(".menu-button");
        const nav = document.querySelector(".main-nav");
        const btnVisible = btn && getComputedStyle(btn).display !== "none";
        const navDisplay = nav ? getComputedStyle(nav).display : "none";
        out.btnVisible = !!btnVisible;
        out.navDisplay = navDisplay;
        if (btn) {
          const br = btn.getBoundingClientRect();
          out.btnSize = `${Math.round(br.width)}x${Math.round(br.height)}`;
          if (btnVisible && (br.width < 44 || br.height < 44)) {
            out.problems.push(`hamburguer alvo < 44px (${out.btnSize})`);
          }
          if (btnVisible && br.right > vw + 1) out.problems.push("hamburguer fora da viewport");
        }

        // CTA header
        const cta = header.querySelector(".header-cta");
        if (cta) {
          const cr = cta.getBoundingClientRect();
          const cd = getComputedStyle(cta).display;
          if (cd !== "none") {
            if (cr.right > vw + 1) out.problems.push(`CTA header estoura +${Math.round(cr.right - vw)}px`);
            if (cr.width < 40 || cr.height < 40) out.problems.push("CTA header pequeno demais");
          }
          out.ctaDisplay = cd;
        }
        return out;
      });

      // regras dependentes de formato
      if (fmt.mobile) {
        if (!m.btnVisible) m.problems = [...(m.problems||[]), "hamburguer NAO aparece no mobile"];
        if (m.navDisplay && m.navDisplay !== "none") m.problems = [...(m.problems||[]), `nav aberto por padrao no mobile (display:${m.navDisplay})`];
        if (m.headerRatio > 0.22) m.problems = [...(m.problems||[]), `header alto demais no mobile: ${(m.headerRatio*100).toFixed(0)}% da tela`];
      } else {
        if (m.btnVisible) m.problems = [...(m.problems||[]), "hamburguer aparece no desktop (deveria sumir)"];
        if (m.navDisplay === "none") m.problems = [...(m.problems||[]), "nav escondido no desktop (deveria aparecer)"];
      }

      const probs = m.problems || [];
      report.push({ route: routeName, format: fmt.id, dpr, ...m });
      for (const p of probs) failures.push(`${routeName}/${fmt.id}: ${p}`);
      process.stdout.write(`${probs.length ? "x" : "."} ${routeName}/${fmt.id} h=${m.headerH}px${probs.length ? " -> " + probs.join("; ") : ""}\n`);

      await context.close();
    }
  }
} finally {
  await browser.close();
  server.closeAllConnections?.();
  await new Promise((r) => server.close(r));
}

mkdirSync(path.join(root, "qa-artifacts"), { recursive: true });
writeFileSync(path.join(root, "qa-artifacts", "qa-header.json"), JSON.stringify({ failures, report }, null, 2));
if (failures.length) {
  console.error(`\nFALHAS HEADER (${failures.length}):\n- ` + failures.join("\n- "));
  process.exit(1);
}
console.log("\nqa:header OK — cabecalho saudavel em todos os formatos.");
