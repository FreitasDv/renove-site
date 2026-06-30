import { mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");

// Porta efemera por padrao (0 = o SO escolhe uma livre). Evita EADDRINUSE
// quando um run anterior nao liberou a porta a tempo. baseUrl so e conhecido
// depois do listen, perguntando a porta real ao servidor.
const requestedPort = Number(process.env.RENOVE_ATLAS_QA_PORT ?? 0);
let baseUrl;
const routes = [
  "/",
  "/emagrecimento-bauru/",
  "/harmonizacao-facial-bauru/",
  "/ferramentas/",
  "/sobre/",
  "/contato/",
  "/politica-de-privacidade/",
  "/blog/",
  "/blog/emagrecimento-saudavel-bauru/",
  "/blog/creatina-no-emagrecimento/",
  "/blog/dieta-ou-acompanhamento-medico/",
];
const widths = [390, 768, 1024, 1280, 1600];
const artifactDir = path.join(root, "qa-artifacts");
mkdirSync(artifactDir, { recursive: true });

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
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 980 } });
      const consoleErrors = [];
      const badResponses = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const metrics = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        const h1 = document.querySelector("h1");
        const cta = document.querySelector('a[href^="https://wa.me/5514981540709"]');
        const header = document.querySelector(".site-header");

        // --- Auditoria visual global: roda em cada elemento renderizado ---
        const viewportWidth = html.clientWidth;
        const isMobile = window.innerWidth <= 480;

        function parseColor(value) {
          const match = value.match(/rgba?\(([^)]+)\)/);
          if (!match) return null;
          const parts = match[1].split(",").map((p) => parseFloat(p.trim()));
          const [r, g, b, a = 1] = parts;
          return { r, g, b, a };
        }
        function relLum({ r, g, b }) {
          const lin = [r, g, b].map((c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
        }
        function blend(fg, bg) {
          const a = fg.a;
          return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
        }
        function contrast(fg, bg) {
          const L1 = relLum(fg);
          const L2 = relLum(bg);
          const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
          return (hi + 0.05) / (lo + 0.05);
        }
        // Resolve o fundo efetivo subindo a arvore ate achar cor opaca.
        function effectiveBg(el) {
          let node = el;
          let acc = { r: 255, g: 255, b: 255, a: 1 };
          const stack = [];
          while (node && node !== document.documentElement) {
            const bg = parseColor(getComputedStyle(node).backgroundColor);
            if (bg && bg.a > 0) stack.unshift(bg);
            node = node.parentElement;
          }
          for (const layer of stack) acc = blend(layer, acc);
          return acc;
        }

        const overflow = [];
        const lowContrast = [];
        const smallTargets = [];
        const seenContrast = new Set();

        const all = document.body.querySelectorAll("*");
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) continue;
          // Elementos decorativos (aria-hidden) sao isentos do criterio de
          // contraste de texto pela WCAG, entao nao contam como defeito.
          if (el.closest('[aria-hidden="true"]')) continue;

          // Overflow so importa se nenhum ancestral recorta (clip/hidden),
          // senao o elemento e contido e nao gera scroll real.
          let clippedByAncestor = false;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const ov = getComputedStyle(p).overflowX;
            if (ov === "hidden" || ov === "clip" || ov === "auto" || ov === "scroll") { clippedByAncestor = true; break; }
          }
          if (rect.right > viewportWidth + 1 && style.position !== "fixed" && !clippedByAncestor) {
            const id = el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : "");
            if (rect.right - viewportWidth > 4) overflow.push(`${id} +${Math.round(rect.right - viewportWidth)}px`);
          }

          // Contraste de texto: so em elementos com texto direto.
          const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
          if (ownText) {
            const fg = parseColor(style.color);
            if (fg) {
              const bg = effectiveBg(el);
              const resolved = fg.a < 1 ? blend(fg, bg) : fg;
              const ratio = contrast(resolved, bg);
              const sizePx = parseFloat(style.fontSize);
              const bold = Number(style.fontWeight) >= 700;
              const large = sizePx >= 24 || (sizePx >= 18.66 && bold);
              const threshold = large ? 3 : 4.5;
              const key = `${style.color}|${Math.round(relLum(bg) * 1000)}|${Math.round(sizePx)}`;
              if (ratio < threshold && !seenContrast.has(key)) {
                seenContrast.add(key);
                const sample = (el.textContent || "").trim().slice(0, 24);
                lowContrast.push(`"${sample}" ${ratio.toFixed(2)}:1 (precisa ${threshold}) ${Math.round(sizePx)}px`);
              }
            }
          }

          // Alvos de toque no mobile: links/botoes < 44px.
          if (isMobile && (el.tagName === "A" || el.tagName === "BUTTON")) {
            const inNav = el.closest(".site-footer, nav");
            if (!inNav && (rect.height < 40 || rect.width < 40) && (el.textContent || "").trim()) {
              smallTargets.push(`${(el.textContent || "").trim().slice(0, 18)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
            }
          }
        }

        // Imagens que falharam ao carregar.
        const brokenImages = [...document.images]
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.currentSrc || img.src);

        return {
          scrollWidth: html.scrollWidth,
          clientWidth: html.clientWidth,
          bodyWidth: body.scrollWidth,
          h1Text: h1?.textContent?.trim() ?? "",
          h1Bottom: h1?.getBoundingClientRect().bottom ?? 0,
          ctaText: cta?.textContent?.trim() ?? "",
          headerBottom: header?.getBoundingClientRect().bottom ?? 0,
          overflow: [...new Set(overflow)].slice(0, 8),
          lowContrast: lowContrast.slice(0, 8),
          smallTargets: [...new Set(smallTargets)].slice(0, 8),
          brokenImages,
        };
      });

      if (consoleErrors.length) failures.push(`${route} ${width}: console errors ${consoleErrors.join(" | ")}`);
      if (badResponses.length) failures.push(`${route} ${width}: bad responses ${badResponses.join(" | ")}`);
      if (metrics.scrollWidth > metrics.clientWidth + 1 || metrics.bodyWidth > metrics.clientWidth + 1) {
        failures.push(`${route} ${width}: horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth}`);
      }
      if (!metrics.h1Text) failures.push(`${route} ${width}: missing h1`);
      if (!metrics.ctaText) failures.push(`${route} ${width}: missing WhatsApp CTA`);
      if (width === 390 && metrics.h1Bottom <= metrics.headerBottom) {
        failures.push(`${route} ${width}: h1 overlaps sticky header`);
      }
      if (metrics.overflow.length) {
        failures.push(`${route} ${width}: elementos fora da viewport -> ${metrics.overflow.join(", ")}`);
      }
      if (metrics.lowContrast.length) {
        failures.push(`${route} ${width}: contraste real abaixo do AA -> ${metrics.lowContrast.join(" | ")}`);
      }
      if (metrics.smallTargets.length) {
        failures.push(`${route} ${width}: alvos de toque < 44px -> ${metrics.smallTargets.join(", ")}`);
      }
      if (metrics.brokenImages.length) {
        failures.push(`${route} ${width}: imagens quebradas -> ${metrics.brokenImages.join(", ")}`);
      }

      const routeName = route === "/" ? "home" : route.replaceAll("/", "-").replace(/^-|-$/g, "");
      // Rola a pagina inteira para disparar os scroll-reveals antes do
      // screenshot, refletindo o que o usuario realmente ve (e nao o
      // estado inicial com blocos ainda esmaecidos).
      await page.evaluate(async () => {
        const step = Math.max(window.innerHeight * 0.8, 400);
        const max = document.documentElement.scrollHeight;
        for (let y = 0; y <= max; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 120));
      });
      await page.screenshot({
        path: path.join(artifactDir, `${routeName}-${width}.png`),
        fullPage: true,
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error("Visual QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Visual QA passed: ${routes.length} routes x ${widths.length} viewports. Screenshots saved to ${artifactDir}`);
