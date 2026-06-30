import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredPages = [
  "index.html",
  "emagrecimento-bauru/index.html",
  "harmonizacao-facial-bauru/index.html",
  "sobre/index.html",
  "contato/index.html",
  "politica-de-privacidade/index.html",
  "blog/index.html",
  "blog/emagrecimento-saudavel-bauru/index.html",
  "blog/creatina-no-emagrecimento/index.html",
  "blog/dieta-ou-acompanhamento-medico/index.html",
];

const forbiddenTerms = [
  "mounjaro",
  "ozempic",
  "wegovy",
  "saxenda",
  "zepbound",
  "tirzepatida",
  "semaglutida",
  "liraglutida",
  "caneta",
  "canetas",
  "22kg",
  "garantido",
  "garantida",
  "milagre",
  "definitivo",
  "sem esforco",
  "sem esforço",
  "comprar medicamento",
  "sem receita",
];

const forbiddenInternalPublicTerms = [
  "pagina final",
  "antes de publicar",
  "versao de publicacao",
  "prototipo",
  "confirmar lista",
  "orientacoes da dra",
  "entra aqui",
  "publicacao aprovada",
  "nao altera a lp viva",
  "renove-os",
  "painel novo",
];

const forbiddenCommercialPriceTerms = [
  "R$",
  "10x",
  '"price"',
  "priceCurrency",
  "priceRange",
  "start r$",
  "bronze r$",
  "prata r$",
  "gold r$",
  "premium r$",
  ">Start<",
  ">Bronze<",
  ">Prata<",
  ">Gold<",
  ">Premium<",
];

const requiredVisibleFacts = [
  "CRM-SP 182.823",
  "RQE 133.088",
  "59.402.454/0001-31",
  "Av. Affonso José Aiello",
  "Bauru",
  "Resultados variam",
];

const requiredCopySignals = [
  ["index.html", "Atendimento presencial em Bauru"],
  ["index.html", "acompanhamento de verdade"],
  ["emagrecimento-bauru/index.html", "começar com segurança ou retomar"],
  ["emagrecimento-bauru/index.html", "plano acompanhado"],
  ["emagrecimento-bauru/index.html", "Acompanhamento semanal"],
  ["emagrecimento-bauru/index.html", "O investimento é explicado na avaliação"],
];

const requiredSchemaTypes = [
  "MedicalClinic",
  "FAQPage",
  "BreadcrumbList",
];

const requiredPageSchemaTypes = [
  ["emagrecimento-bauru/index.html", "Service"],
  ["harmonizacao-facial-bauru/index.html", "Service"],
  ["sobre/index.html", "Physician"],
  ["contato/index.html", "ContactPage"],
];

const requiredCssTokens = new Map([
  ["--paper", "#f4eee8"],
  ["--surface", "#fffdf9"],
  ["--cream", "#fffaf3"],
  ["--sand", "#ece0d2"],
  ["--deep-blue", "#102a3d"],
  ["--ink", "#0f2435"],
  ["--reading", "#193548"],
  ["--ocean", "#23648c"],
  ["--petrol", "#296c7b"],
  ["--aqua", "#a5d6cf"],
  ["--sky", "#bfd3e0"],
  ["--clay", "#d9aa8f"],
]);

const failures = [];

function readPage(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing page: ${relativePath}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return fullPath;
  });
}

const pageContents = requiredPages.map((page) => [page, readPage(page)]);
const combinedPages = pageContents.map(([, html]) => html).join("\n").toLowerCase();
const stylesPath = path.join(root, "styles.css");
const styles = existsSync(stylesPath) ? readFileSync(stylesPath, "utf8") : "";

for (const term of forbiddenTerms) {
  if (combinedPages.includes(term)) {
    failures.push(`Forbidden public term found in HTML: ${term}`);
  }
}

for (const term of forbiddenInternalPublicTerms) {
  if (combinedPages.includes(term)) {
    failures.push(`Internal/prototype term found in public HTML: ${term}`);
  }
}

for (const term of forbiddenCommercialPriceTerms) {
  if (combinedPages.includes(term.toLowerCase())) {
    failures.push(`Unapproved public pricing/commercial ladder term found in HTML/schema: ${term}`);
  }
}

for (const [page, html] of pageContents) {
  if (!html) continue;
  if (!html.includes("<title>")) failures.push(`${page}: missing title`);
  if (!html.includes('name="description"')) failures.push(`${page}: missing meta description`);
  if (!html.includes('rel="canonical"')) failures.push(`${page}: missing canonical`);
  if (!html.includes("https://wa.me/5514981540709")) failures.push(`${page}: missing WhatsApp CTA`);
  if (!html.includes("utm_source=")) failures.push(`${page}: missing UTM on WhatsApp CTA`);
  if (!html.includes('loading="lazy"')) failures.push(`${page}: missing lazy-loading image signal`);
  if (!html.includes('alt="')) failures.push(`${page}: missing alt attributes`);
  if (!html.includes('type="application/ld+json"')) failures.push(`${page}: missing JSON-LD`);
  if (!html.includes('href="/')) failures.push(`${page}: navigation should use root-relative links`);

  // Accessibility: heading hierarchy must have a single h1 and no skipped levels.
  const headingLevels = [...html.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  const h1Count = headingLevels.filter((level) => level === 1).length;
  if (h1Count !== 1) failures.push(`${page}: expected exactly one <h1>, found ${h1Count}`);
  let maxSeen = 0;
  for (const level of headingLevels) {
    if (maxSeen && level > maxSeen + 1) {
      failures.push(`${page}: heading level skips from h${maxSeen} to h${level}`);
      break;
    }
    maxSeen = Math.max(maxSeen, level);
  }
}

for (const fact of requiredVisibleFacts) {
  if (!pageContents.some(([, html]) => html.includes(fact))) {
    failures.push(`Missing visible compliance fact: ${fact}`);
  }
}

for (const [page, signal] of requiredCopySignals) {
  const html = pageContents.find(([candidate]) => candidate === page)?.[1] ?? "";
  if (!html.toLowerCase().includes(signal.toLowerCase())) {
    failures.push(`${page}: missing strategic copy signal "${signal}"`);
  }
}

const emagrecimentoHtml = pageContents.find(([page]) => page === "emagrecimento-bauru/index.html")?.[1] ?? "";
if (!emagrecimentoHtml.includes('class="comparison proof-contrast"')) {
  failures.push("emagrecimento-bauru/index.html: proof comparison must use the editorial proof-contrast structure");
}
if (!styles.includes(".page-lp .proof-section .proof-contrast")) {
  failures.push("styles.css: missing the page-scoped editorial proof-contrast treatment");
}

for (const schemaType of requiredSchemaTypes) {
  if (!pageContents.some(([, html]) => html.includes(`"@type": "${schemaType}"`))) {
    failures.push(`Missing schema type: ${schemaType}`);
  }
}

for (const [page, schemaType] of requiredPageSchemaTypes) {
  const html = pageContents.find(([candidate]) => candidate === page)?.[1] ?? "";
  if (!html.includes(`"@type": "${schemaType}"`)) {
    failures.push(`${page}: missing page-specific schema type ${schemaType}`);
  }
}

for (const [token, value] of requiredCssTokens) {
  if (!styles.includes(`${token}: ${value}`)) {
    failures.push(`styles.css: missing or altered Renove token ${token}: ${value}`);
  }
}

// Accessibility: text tokens used on paper must clear WCAG AA (4.5:1) for normal text.
function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function tokenValue(name) {
  return styles.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? null;
}
const paper = tokenValue("--paper");
const textOnPaperTokens = ["--ink", "--reading", "--muted", "--muted-soft", "--ocean", "--petrol"];
for (const token of textOnPaperTokens) {
  const color = tokenValue(token);
  if (!color || !paper) continue;
  const ratio = contrastRatio(color, paper);
  if (ratio < 4.5) {
    failures.push(`styles.css: ${token} (${color}) on --paper is ${ratio.toFixed(2)}:1, below WCAG AA 4.5:1`);
  }
}

// Os padroes param em "}" para nao atravessar blocos vizinhos.
// Antes, "[\s\S]*?" era guloso o bastante para casar um seletor .btn distante
// com o clay decorativo (ex.: barra de .decision-rail article::before), gerando falso positivo.
const clayActionSelectors = [
  /\.btn-primary\s*\{[^}]*?background:\s*var\(--clay\)/,
  /\.header-cta[^{]*\{[^}]*?background:\s*var\(--clay\)/,
  /\.investment-section\s+\.btn[^{]*\{[^}]*?background:\s*var\(--clay\)/,
  /\.cta-section\s+\.btn[^{]*\{[^}]*?background:\s*var\(--clay\)/,
];

if (clayActionSelectors.some((pattern) => pattern.test(styles))) {
  failures.push("styles.css: clay cannot be used as an action/CTA background");
}

const assetFiles = walkFiles(path.join(root, "assets"));
for (const file of assetFiles) {
  const normalized = path.basename(file).toLowerCase();
  for (const risky of ["tirzepatida", "22kg", "antes", "depois", "mounjaro", "ozempic"]) {
    if (normalized.includes(risky)) {
      failures.push(`Risky asset filename: ${path.relative(root, file)}`);
    }
  }
  if (statSync(file).size > 700_000) {
    failures.push(`Asset too heavy for prototype budget: ${path.relative(root, file)}`);
  }
}

if (failures.length) {
  console.error("Content QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content QA passed: ${requiredPages.length} pages checked, ${assetFiles.length} assets checked.`);
