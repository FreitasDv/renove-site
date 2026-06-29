/* ============================================================
   QA TRANSITION GATE — SPEC_SISTEMA_DESIGN_R9 §2/§3/§7 (Fatia 2).
   Mata o "corte seco": toda fronteira entre dois ANDARES TONAIS
   diferentes (CLARO/TINTA/PROFUNDO) precisa de >=1 device de
   transicao T1-T4. Roda nos 5 breakpoints da LEI DOS 5 BREAKPOINTS.

   Devices (SPEC §3):
     T1 - Veu de borda: ::before/::after com gradiente na fronteira.
     T2 - Folha-ponte: .botanical/.leaf cujo rect ATRAVESSA a fronteira.
     T3 - Degrau tonal: hairline --rule (border) entre as secoes.
     T4 - Overlap: secao seguinte com border-radius + margin-top negativa.

   Saida:
     - Fronteira entre ANDARES DIFERENTES sem device = FAIL (exit 1).
     - CLARO->CLARO adjacente sem device = WARN (vira FAIL se
       RENOVE_TRANSITION_STRICT=1) — calibravel p/ evitar falso positivo.
   ============================================================ */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");

const port = Number(process.env.RENOVE_ATLAS_QA_PORT ?? 4199);
const baseUrl = `http://127.0.0.1:${port}`;
const strict = process.env.RENOVE_TRANSITION_STRICT === "1";

// Rotas full-bleed (mesmas do qa-depth + as que tem secoes empilhadas).
const routes = [
  "/",
  "/emagrecimento-bauru/",
  "/harmonizacao-facial-bauru/",
  "/sobre/",
  "/contato/",
];

// LEI DOS 5 BREAKPOINTS (SPEC §4).
const breakpoints = [390, 768, 1024, 1280, 1600];

// Andares tonais (SPEC §2). RGB resolvidos dos tokens em styles.css.
const ANDARES = {
  CLARO: [
    "rgb(255, 250, 243)", // cream
    "rgb(255, 253, 249)", // surface
    "rgb(244, 238, 232)", // paper (base do body)
    "rgb(255, 255, 255)", // branco puro
  ],
  TINTA: [
    "rgb(207, 224, 221)", // glacier
    "rgb(236, 224, 210)", // sand
    "rgb(226, 237, 234)", // glacier-soft
  ],
  PROFUNDO: [
    "rgb(16, 42, 61)", // deep-blue
    "rgb(41, 108, 123)", // petrol
    "rgb(35, 100, 140)", // ocean
  ],
};

const server = createStaticServer();
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });
const failures = [];
const warnings = [];

try {
  for (const route of routes) {
    for (const width of breakpoints) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      // dispara reveals e estabiliza layout
      await page.evaluate(async () => {
        await new Promise((r) => {
          let y = 0;
          const step = () => {
            window.scrollTo(0, y);
            y += window.innerHeight;
            if (y < document.body.scrollHeight) requestAnimationFrame(step);
            else { window.scrollTo(0, 0); setTimeout(r, 120); }
          };
          step();
        });
      });

      const result = await page.evaluate((andaresMap) => {
        // ---- helpers ----
        const toAndar = (rgb) => {
          for (const [name, list] of Object.entries(andaresMap)) {
            if (list.includes(rgb)) return name;
          }
          return null;
        };
        const isOpaque = (rgb) =>
          rgb && rgb !== "rgba(0, 0, 0, 0)" && rgb !== "transparent" &&
          !/rgba\([^)]+,\s*0\)\s*$/.test(rgb);
        // bg efetivo: sobe ate achar cor opaca
        const effectiveBg = (el) => {
          let cur = el;
          while (cur) {
            const bg = getComputedStyle(cur).backgroundColor;
            if (isOpaque(bg)) return bg;
            cur = cur.parentElement;
          }
          return "rgb(244, 238, 232)"; // paper (fallback body)
        };
        const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
        const docBottom = (el) => el.getBoundingClientRect().bottom + window.scrollY;

        // ---- coleta secoes full-bleed unicas em ordem de documento ----
        const raw = document.querySelectorAll(
          "main > section, main > div, .home-method, .care-section, .proof-section, .cta-section, .qualifier-section, .investment-section"
        );
        const seen = new Set();
        const sections = [];
        for (const el of raw) {
          if (seen.has(el)) continue;
          seen.add(el);
          const rect = el.getBoundingClientRect();
          if (rect.width < window.innerWidth * 0.6 || rect.height < 200) continue;
          sections.push(el);
        }
        sections.sort((a, b) => docTop(a) - docTop(b));

        // ---- detecta device na fronteira entre secA (cima) e secB (baixo) ----
        const boundaryDevices = (secA, secB) => {
          const found = [];
          const csA = getComputedStyle(secA);
          const csB = getComputedStyle(secB);
          const aAfter = getComputedStyle(secA, "::after");
          const aBefore = getComputedStyle(secA, "::before");
          const bAfter = getComputedStyle(secB, "::after");
          const bBefore = getComputedStyle(secB, "::before");

          // T1 — veu de borda via pseudo-elemento com gradiente
          const hasGrad = (cs) =>
            cs.content !== "none" &&
            ((cs.backgroundImage && cs.backgroundImage.includes("gradient")) ||
              (cs.background && cs.background.includes("gradient")));
          if (hasGrad(aAfter) || hasGrad(aBefore) || hasGrad(bAfter) || hasGrad(bBefore)) {
            found.push("T1");
          }

          // T2 — folha-ponte atravessando a fronteira
          const boundary = (docBottom(secA) + docTop(secB)) / 2;
          const leaves = document.querySelectorAll(".botanical, .leaf, [class*='leaf']");
          for (const lf of leaves) {
            const t = docTop(lf);
            const b = docBottom(lf);
            if (t < boundary && b > boundary) { found.push("T2"); break; }
          }

          // T3 — degrau tonal: hairline --rule (border visivel) na fronteira
          const ruleColors = ["rgb(15, 36, 53)", "rgba(15, 36, 53, 0.16)"];
          const hasRule = (cs, side) => {
            const w = parseFloat(cs[`border${side}Width`]);
            const col = cs[`border${side}Color`];
            const sty = cs[`border${side}Style`];
            return w > 0 && sty !== "none" &&
              (col.startsWith("rgba(15, 36, 53") || col === "rgb(15, 36, 53)");
          };
          if (hasRule(csA, "Bottom") || hasRule(csB, "Top")) found.push("T3");
          // hr.rule entre as duas tambem conta como T3
          const hr = secB.previousElementSibling;
          if (hr && (hr.tagName === "HR" || /rule|divider/i.test(hr.className))) found.push("T3");

          // T4 — overlap: secB com border-radius + margin-top negativa
          const radius = parseFloat(csB.borderTopLeftRadius) || parseFloat(csB.borderRadius) || 0;
          const mt = parseFloat(csB.marginTop) || 0;
          if (radius > 8 && mt < 0) found.push("T4");

          return [...new Set(found)];
        };

        // ---- avalia cada par adjacente ----
        const pairs = [];
        for (let i = 0; i < sections.length - 1; i++) {
          const secA = sections[i];
          const secB = sections[i + 1];
          const andA = toAndar(effectiveBg(secA));
          const andB = toAndar(effectiveBg(secB));
          const devices = boundaryDevices(secA, secB);
          pairs.push({
            i,
            clsA: secA.className.split(" ").slice(0, 2).join(".") || secA.tagName.toLowerCase(),
            clsB: secB.className.split(" ").slice(0, 2).join(".") || secB.tagName.toLowerCase(),
            andA,
            andB,
            bgA: effectiveBg(secA),
            bgB: effectiveBg(secB),
            devices,
          });
        }
        return pairs;
      }, ANDARES);

      for (const p of result) {
        const where = `${route} @${width}px [${p.i}->${p.i + 1}] .${p.clsA}(${p.andA ?? "?"}) -> .${p.clsB}(${p.andB ?? "?"})`;
        const hasDevice = p.devices.length > 0;
        const diffAndar = p.andA && p.andB && p.andA !== p.andB;
        const sameClaroClaro = p.andA === "CLARO" && p.andB === "CLARO";

        if (diffAndar && !hasDevice) {
          failures.push(`CORTE SECO entre andares: ${where} — sem device T1-T4 (bg ${p.bgA} | ${p.bgB})`);
        } else if (sameClaroClaro && !hasDevice) {
          const msg = `CLARO->CLARO adjacente sem transicao: ${where} (SPEC §2 proibe)`;
          if (strict) failures.push(msg); else warnings.push(msg);
        }
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (warnings.length) {
  console.warn(`Transition QA — ${warnings.length} aviso(s) (nao bloqueante; RENOVE_TRANSITION_STRICT=1 p/ bloquear):`);
  for (const w of warnings) console.warn("  ~ " + w);
}

if (failures.length) {
  console.error(`Transition QA FAILED — ${failures.length} fronteira(s) com corte seco:`);
  for (const f of failures) console.error("- " + f);
  process.exit(1);
} else {
  console.log(
    `Transition QA passed: ${routes.length} rotas × ${breakpoints.length} breakpoints, toda fronteira entre andares diferentes tem device T1-T4.`
  );
}
