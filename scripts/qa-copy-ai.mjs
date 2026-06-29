/* ============================================================
   QA COPY-AI GATE — anti "copy de IA / burocratica" (Fatia 5, calibravel).
   Roda ESTATICO nos HTMLs publicos (sem browser). Le o texto visivel e
   os textos-ancora de CTA de WhatsApp e sinaliza dois problemas:

   A) VOZ PASSIVA / BUROCRATICA no corpo do texto:
        "e definido", "e realizado", "e feito", "sao realizados",
        "visando", "atraves de", "por meio de", "mediante",
        "no intuito de", "conforme necessidade".
      (a Renove e clinica medica humana; a copy fala "a gente faz",
       nao "o procedimento e realizado".)

   B) CTA ROBOTICO em links de WhatsApp quando e CTA primario:
        "clique aqui", "saiba mais", "abrir conversa".

   Calibragem:
     - Default: WARNING por arquivo (nao bloqueia).
     - RENOVE_COPY_STRICT=1 -> qualquer achado vira FAIL (exit 1).
     - Ignora <script>, <style>, <head>, comentarios e a pasta _internal.

   Saida: relatorio por arquivo, com trecho e tipo do achado.
   ============================================================ */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.env.RENOVE_COPY_STRICT === "1";

// HTMLs publicos (exclui node_modules, .git, _internal)
let files = [];
try {
  files = globSync("**/*.html", { cwd: root })
    .filter((f) => !f.startsWith("node_modules") && !f.startsWith(".git") && !f.startsWith("_internal"));
} catch {
  // fallback: lista fixa caso globSync nao exista nesta versao do node
  files = [
    "index.html", "404.html",
    "blog/index.html", "blog/creatina-no-emagrecimento/index.html",
    "blog/dieta-ou-acompanhamento-medico/index.html", "blog/emagrecimento-saudavel-bauru/index.html",
    "contato/index.html", "emagrecimento-bauru/index.html", "ferramentas/index.html",
    "harmonizacao-facial-bauru/index.html", "politica-de-privacidade/index.html", "sobre/index.html",
  ].filter((f) => existsSync(path.join(root, f)));
}
files.sort();

// normaliza acentos para casar com/sem acento
const deburr = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// padroes de voz passiva/burocratica (sem acento, ja deburrado o texto)
const PASSIVE = [
  { re: /\be\s+definid[oa]s?\b/gi, label: "voz passiva: 'e definido'" },
  { re: /\be\s+realizad[oa]s?\b/gi, label: "voz passiva: 'e realizado'" },
  { re: /\be\s+feit[oa]s?\b/gi, label: "voz passiva: 'e feito'" },
  { re: /\bsao\s+realizad[oa]s?\b/gi, label: "voz passiva: 'sao realizados'" },
  { re: /\bvisando\b/gi, label: "burocratico: 'visando'" },
  { re: /\batraves\s+de\b/gi, label: "burocratico: 'atraves de'" },
  { re: /\bpor\s+meio\s+de\b/gi, label: "burocratico: 'por meio de'" },
  { re: /\bmediante\b/gi, label: "burocratico: 'mediante'" },
  { re: /\bno\s+intuito\s+de\b/gi, label: "burocratico: 'no intuito de'" },
  { re: /\bconforme\s+necessidade\b/gi, label: "burocratico: 'conforme necessidade'" },
];

// CTA robotico (texto-ancora de WhatsApp)
const ROBOTIC_CTA = [
  { re: /^clique\s+aqui$/i, label: "CTA robotico: 'clique aqui'" },
  { re: /^saiba\s+mais$/i, label: "CTA robotico: 'saiba mais'" },
  { re: /^abrir\s+conversa$/i, label: "CTA robotico: 'abrir conversa'" },
];

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// extrai <a ... href="...wa.me/whatsapp...">TEXTO</a>
function whatsappAnchors(html) {
  const out = [];
  const re = /<a\b[^>]*href="([^"]*(?:wa\.me|whatsapp)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) out.push(text);
  }
  return out;
}

const report = {};
let totalFindings = 0;

for (const rel of files) {
  const html = readFileSync(path.join(root, rel), "utf8");
  const text = deburr(visibleText(html));
  const findings = [];

  for (const { re, label } of PASSIVE) {
    const hits = text.match(re);
    if (hits && hits.length) {
      findings.push(`${label} (x${hits.length}) ex: "...${snippet(text, hits[0])}..."`);
    }
  }

  for (const anchor of whatsappAnchors(html)) {
    const a = deburr(anchor).trim();
    for (const { re, label } of ROBOTIC_CTA) {
      if (re.test(a)) findings.push(`${label} no link WhatsApp: "${anchor}"`);
    }
  }

  if (findings.length) {
    report[rel] = findings;
    totalFindings += findings.length;
  }
}

function snippet(text, term) {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return term;
  return text.slice(Math.max(0, i - 18), i + term.length + 18).trim();
}

// imprime relatorio
const arquivosComAchado = Object.keys(report).length;
if (arquivosComAchado) {
  const head = strict ? "Copy-AI QA FAILED" : "Copy-AI QA — avisos";
  const fn = strict ? console.error : console.warn;
  fn(`${head} — ${totalFindings} achado(s) em ${arquivosComAchado} arquivo(s)${strict ? "" : " (nao bloqueante; RENOVE_COPY_STRICT=1 p/ bloquear)"}:`);
  for (const [file, items] of Object.entries(report)) {
    fn(`  ${file}:`);
    for (const it of items) fn(`    - ${it}`);
  }
  if (strict) process.exit(1);
} else {
  console.log(`Copy-AI QA passed: ${files.length} HTMLs publicos, sem voz passiva/burocratica listada nem CTA robotico de WhatsApp.`);
}
