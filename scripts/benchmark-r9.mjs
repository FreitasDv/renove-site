import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRenoveOs = createRequire(path.resolve(root, "../renove-os/package.json"));
const { chromium } = requireFromRenoveOs("playwright");

const artifactDir = path.join(root, "qa-artifacts", "benchmark-r9");
const docsDir = path.join(root, "docs");
mkdirSync(artifactDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

const references = [
  ["renove-atual", "Renove Clinic atual", "https://renoveclinic.com.br/"],
  ["emagrecentro", "Emagrecentro nacional", "https://emagrecentro.com.br/"],
  ["emagrecentro-bauru", "Emagrecentro Bauru", "https://emagrecentrobauru.com.br/clinica-de-estetica-e-emagrecimento-em-bauru/"],
  ["magrass-bauru", "Magrass Bauru", "https://www.unidadesmagrass.com.br/bauru"],
  ["botoclinic", "Botoclinic nacional", "https://botoclinic.com/"],
  ["botoclinic-bauru", "Botoclinic Bauru Shopping", "https://botoclinic.com/blog/lojas/bauru-shopping/"],
  ["elegance-bauru", "Elegance Estetica Bauru", "https://www.eleganceestetica.com.br/"],
  ["fisicom-bauru", "Clinica Fisicom Bauru", "https://clinicafisicom.com.br/"],
  ["status-bauru", "Clinica Status Bauru", "https://clinicastatus.com.br/"],
  ["leger", "Clinica Leger", "https://www.clinicaleger.com.br/"],
  ["enjoy", "Enjoy Institute", "https://enjoyinstitute.com.br/"],
  ["pro-estetica", "Pro Estetica", "https://proesteticaoficial.com.br/"],
  ["palladium", "Palladium Estetica", "https://palladiumestetica.com.br/"],
  ["peso-menor", "Peso Menor", "https://pesomenor.com.br/"],
  ["dra-regina-diniz", "Dra Regina Diniz", "https://www.drareginadiniz.com.br/"],
  ["dr-luis-ricardo", "Dr Luis Ricardo Nutrologia", "https://drluisricardonutrologia.com.br/"],
  ["rearmonize", "Rearmonize Estetica", "https://www.rearmonizeestetica.com.br/"],
  ["revitalle", "Revitalle Clinic", "https://www.sejarevitalle.com.br/"],
  ["espaco-facial", "Espaco Facial", "https://espacofacial.com.br/"],
  ["royal-face-bauru", "Royal Face Bauru", "https://royalface.com.br/unidade/bauru-sp/"],
  ["joao-gabriele", "Clinica Dr Joao Gabriele", "https://www.clinicadrjoaogabriele.com.br/estetica-facial"],
  ["mef-emagrecimento-sp", "MEF emagrecimento SP", "https://emfoco.med.br/clinica-de-emagrecimento-em-sao-paulo-cuide-da-saude/"],
  ["dr-rodrigo-barbosa", "Dr Rodrigo Barbosa / MEF", "https://drrodrigobarbosa.com.br/clinica-de-emagrecimento-em-sao-paulo/"],
  ["dra-andrea-nutrologia", "Dra Andrea Pereira Nutrologia", "https://www.draandreanutrologia.com.br/"],
  ["dr-gustavo-lima", "Dr Gustavo de Oliveira Lima", "https://drgustavodeoliveiralima.com/"],
  ["ortomolecular", "Dr Reginaldo Ortomolecular", "https://www.ortomolecular.me/"],
  ["doctoralia-nutrologos-sp", "Doctoralia Nutrologos SP", "https://www.doctoralia.com.br/nutrologo/sao-paulo"],
  ["doctoralia-emagrecimento-bauru", "Doctoralia Emagrecimento Bauru", "https://www.doctoralia.com.br/doencas/emagrecimento/bauru"],
  ["dra-nelly-kim", "Dra Nelly Kim", "https://dranellykim.com.br/"],
  ["dr-wagner-barbi", "Dr Wagner Barbi", "https://drwagnerbarbi.com.br/"],
];

function screenshotName(index, slug, variant) {
  return `${String(index + 1).padStart(2, "0")}-${slug}-${variant}.png`;
}

function classify(data, ok) {
  if (!ok) return { score: 0, label: "REFERENCIA FRACA" };
  let total = 0;
  const text = `${data.title} ${data.h1} ${data.text}`.toLowerCase();
  if (data.h1 && data.h1.length > 18) total += 3;
  if (data.ctas.length) total += 3;
  if (/crm|rqe|m[eé]dic|nutr[oó]log|endocrino|especialista|doutor|dra\.?|dr\.?/.test(text)) total += 3;
  if (/depoimento|avalia[cç][aã]o|google|anos|pacientes|unidades|resultados/.test(text)) total += 3;
  if (/blog|artigo|conte[uú]do|faq|perguntas|obesidade|emagrecimento|harmoniza[cç][aã]o/.test(text)) total += 3;
  if (/whatsapp|agendar|consulta|avalia[cç][aã]o|fale|contato|marcar/.test(text)) total += 3;
  if (data.hasForm) total += 2;
  if (data.heroImageCount > 0) total += 2;
  const score = Math.min(5, Math.round((total / 22) * 5));
  const label = score >= 4 ? "REFERENCIA FORTE" : score >= 2 ? "REFERENCIA MEDIA" : "REFERENCIA FRACA";
  return { score, label };
}

async function extractData(page) {
  return page.evaluate(() => {
    const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
    const text = clean(document.body?.innerText || "").slice(0, 4500);
    const h1 = clean(document.querySelector("h1")?.innerText || "");
    const title = document.title || "";
    const ctas = [...document.querySelectorAll("a,button")]
      .map((el) => clean(el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || ""))
      .filter((value) => /whatsapp|agend|consulta|avali|fale|contato|comece|quero|saiba|marcar|vamos/i.test(value))
      .slice(0, 8);
    const proof = [...document.querySelectorAll("body *")]
      .map((el) => clean(el.innerText || ""))
      .filter((value) => value.length < 180 && /crm|rqe|google|anos|pacientes|unidades|depoimento|avalia[cç][aã]o|especialista|m[eé]dic/i.test(value))
      .slice(0, 8);
    const seo = [...document.querySelectorAll("h2,h3")]
      .map((el) => clean(el.innerText || ""))
      .filter(Boolean)
      .slice(0, 8);
    const heroImageCount = [...document.images].filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.width > 180 && rect.height > 120;
    }).length;
    const hasForm = Boolean(document.querySelector("form,input,textarea,select"));
    return { title, h1, text, ctas, proof, seo, heroImageCount, hasForm };
  });
}

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (let index = 0; index < references.length; index += 1) {
    const [slug, name, url] = references[index];
    const row = {
      index: index + 1,
      slug,
      name,
      url,
      ok: false,
      status: "",
      title: "",
      h1: "",
      ctas: [],
      proof: [],
      seo: [],
      screenshots: [],
      error: "",
      score: 0,
      label: "REFERENCIA FRACA",
    };
    const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    });
    page.setDefaultTimeout(18_000);

    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 22_000 });
      row.status = response ? `${response.status()} ${response.statusText()}` : "sem response";
      await page.waitForTimeout(1_600);
      const desktop = screenshotName(index, slug, "desktop");
      await page.screenshot({ path: path.join(artifactDir, desktop), fullPage: false });
      row.screenshots.push(`qa-artifacts/benchmark-r9/${desktop}`);

      const data = await extractData(page);
      Object.assign(row, data, { ok: true });
      Object.assign(row, classify(data, true));

      if (row.score >= 3 || index < 12) {
        await page.setViewportSize({ width: 390, height: 860 });
        await page.waitForTimeout(900);
        const mobile = screenshotName(index, slug, "mobile");
        await page.screenshot({ path: path.join(artifactDir, mobile), fullPage: false });
        row.screenshots.push(`qa-artifacts/benchmark-r9/${mobile}`);
      }
    } catch (error) {
      row.error = `${error.name}: ${error.message}`.slice(0, 300);
    } finally {
      await page.close();
      results.push(row);
      console.log(`${row.index}/30 ${row.ok ? "OK" : "FAIL"} ${row.slug} ${row.score}/5`);
    }
  }
} finally {
  await browser.close();
}

const strong = results.filter((item) => item.label === "REFERENCIA FORTE");
const medium = results.filter((item) => item.label === "REFERENCIA MEDIA");
const weak = results.filter((item) => item.label === "REFERENCIA FRACA");
const screenshotCount = results.reduce((sum, item) => sum + item.screenshots.length, 0);

const patterns = [
  "A primeira dobra precisa dizer a promessa operacional em uma frase concreta, nao apenas uma promessa aspiracional.",
  "CTA deve aparecer como proximo passo claro: avaliacao, consulta ou WhatsApp, com microcopy de seguranca.",
  "Credenciais medicas e responsavel tecnico devem aparecer cedo quando o tema e saude/emagrecimento.",
  "Preco como filtro e diferencial local funciona porque muitos concorrentes escondem valor.",
  "Prova local vale mais que adjetivo premium: endereco, Google, CRM/RQE, equipe e fotos reais.",
  "Sites fortes usam pagina de servico com FAQ/SEO, nao apenas home bonita.",
  "Mobile precisa ter hierarquia propria: H1 curto, CTA visivel e secao seguinte ja sugerida.",
  "Harmonizacao facial vende melhor quando fala naturalidade/avaliacao, nao exagero/procedimento solto.",
  "Emagrecimento medico precisa separar acompanhamento de dieta, aparelho ou atalho para ganhar confianca.",
  "Lead magnet/formulario so vale se tiver motivo clinico/comercial claro; formulario generico enfraquece.",
];

const antiPatterns = [
  "Hero abstrato demais sem cidade, responsavel ou servico concreto.",
  "Card wall repetitivo com todos os blocos no mesmo peso.",
  "Fotos stock ou estetica generica sem sinal de clinica real.",
  "CTA solto sem explicar o que acontece depois do clique.",
  "Uso de promessa absoluta, resultado fixo ou tom milagroso.",
  "Texto medico longo sem escaneabilidade, FAQ ou subtitulos uteis.",
  "Menu/rodape com links relativos quebraveis ou pouca clareza de rotas.",
  "Prova social sem origem: milhares atendidos sem contexto verificavel.",
  "Pagina de unidade/local sem reforcar bairro, mapa, WhatsApp e horario.",
  "Visual premium que depende de gradiente/glow e nao de foto, ritmo e conteudo.",
];

let markdown = `# Benchmark R9 Site - 30 Referencias\n\n`;
markdown += `Data: 2026-06-26\n\n`;
markdown += `Escopo: benchmark real com Playwright para evoluir o site Renove R9. Screenshots salvos em \`qa-artifacts/benchmark-r9/\`.\n\n`;
markdown += `## Resumo\n\n`;
markdown += `- Referencias tentadas: ${results.length}\n`;
markdown += `- Referencias abertas com screenshot: ${results.filter((item) => item.ok).length}\n`;
markdown += `- Screenshots gerados: ${screenshotCount}\n`;
markdown += `- Fortes: ${strong.length}\n`;
markdown += `- Medias: ${medium.length}\n`;
markdown += `- Fracas/bloqueadas: ${weak.length}\n\n`;
markdown += `## Lista Final\n\n`;
markdown += `| # | Referencia | URL | Status | Score | Classe | Screenshots |\n`;
markdown += `|---:|---|---|---|---:|---|---|\n`;
for (const row of results) {
  const status = row.ok ? row.status : `FAIL: ${row.error}`;
  markdown += `| ${row.index} | ${row.name} | ${row.url} | ${status} | ${row.score}/5 | ${row.label} | ${row.screenshots.join("<br>")} |\n`;
}

markdown += `\n## Q&A Sintetico por Referencia\n\n`;
for (const row of results) {
  markdown += `### ${String(row.index).padStart(2, "0")}. ${row.name}\n\n`;
  markdown += `- Primeira dobra: ${row.h1 || row.title || (row.ok ? "sem H1 claro extraido" : "bloqueado/erro")}\n`;
  markdown += `- CTA principal observado: ${row.ctas[0] || "nao extraido"}\n`;
  markdown += `- Prova/confianca: ${row.proof.slice(0, 3).join(" | ") || "nao extraida"}\n`;
  markdown += `- Conteudo/SEO: ${row.seo.slice(0, 3).join(" | ") || "nao extraido"}\n`;
  markdown += `- Ferramenta/formulario: ${row.hasForm ? "tem formulario/campo" : "nao identificado na primeira leitura"}\n`;
  markdown += `- Decisao visual nao generica: ${row.heroImageCount ? "usa imagem/visual forte na dobra" : "depende mais de texto/layout"}\n`;
  markdown += `- Risco/template: ${row.ok ? (row.score <= 2 ? "hierarquia/prova fraca ou pagina pouco acionavel" : "extrair principio sem copiar") : "nao usar como referencia visual sem nova tentativa"}\n`;
  markdown += `- Principio para o R9: ${row.label === "REFERENCIA FORTE" ? "transformar clareza, prova e CTA em decisao de dobra" : row.label === "REFERENCIA MEDIA" ? "extrair apenas um padrao util" : "usar como anti-exemplo ou substituir"}\n\n`;
}

markdown += `## Top 10 Padroes que Elevam o R9\n\n`;
markdown += patterns.map((item, index) => `${index + 1}. ${item}`).join("\n");
markdown += `\n\n## Top 10 Anti-padroes a Evitar\n\n`;
markdown += antiPatterns.map((item, index) => `${index + 1}. ${item}`).join("\n");
markdown += `\n\n## Decisoes Concretas para Home\n\n`;
markdown += `- Manter preco Start R$997 como filtro de curiosos, mas sustentar com escada de valor real.\n`;
markdown += `- Trazer credenciais e prova local ainda mais cedo: CRM/RQE, Bauru, Google e equipe.\n`;
markdown += `- Reduzir qualquer headline abstrato; cada dobra deve dizer servico, acompanhamento e proximo passo.\n`;
markdown += `- Usar o print de planos como referencia de escada visual, nao como tabela seca.\n\n`;
markdown += `## Decisoes Concretas para Paginas Internas\n\n`;
markdown += `- Emagrecimento: reforcar Start/Bronze/Gold como niveis de acompanhamento, sem falar mg.\n`;
markdown += `- HOF: manter naturalidade, avaliacao individual e responsavel tecnico como eixo.\n`;
markdown += `- Contato: mapa, bairro e WhatsApp devem ficar triviais no mobile.\n`;
markdown += `- Blog: separar conteudo organico educativo de paginas de campanha paga.\n\n`;
markdown += `## Ideias de Ferramentas / Lead Magnets\n\n`;
markdown += `1. Checklist de avaliacao: perguntas que a paciente leva para a consulta.\n`;
markdown += `2. Guia rapido: o que muda quando ha medica + nutricionista no mesmo acompanhamento.\n`;
markdown += `3. Quiz leve de prontidao para avaliacao, sem diagnostico e sem promessa.\n`;
markdown += `4. Tabela editorial dos planos, baseada no print corrigido.\n\n`;
markdown += `## Primeiro Lote Implementado Antes do Benchmark\n\n`;
markdown += `- Preco corrigido para R$997 no QA.\n`;
markdown += `- Links root-relative.\n`;
markdown += `- A11y dos depoimentos.\n`;
markdown += `- Contraste e alvos de toque corrigidos.\n\n`;
markdown += `## QA Rodado\n\n`;
markdown += `Antes deste benchmark, \`npm test\` passou em 26/06/2026: content, a11y e visual.\n`;

writeFileSync(path.join(docsDir, "BENCHMARK_30_REFERENCIAS_R9_SITE_2026-06-26.md"), markdown, "utf8");
writeFileSync(path.join(artifactDir, "benchmark-data.json"), JSON.stringify(results, null, 2), "utf8");

console.log(`Benchmark concluido: ${results.length} referencias, ${screenshotCount} screenshots.`);
