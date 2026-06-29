/* ============================================================
   IMC EMBUTIDO — Renove Clinic
   Ferramenta de IMC embutida no fluxo da pagina de emagrecimento.
   Estrategia (sua direcao + NN/g):
   - Valor primeiro: resultado imediato e contextualizado, sem cadastro.
   - O CTA monta um link wa.me com o FEEDBACK do IMC anexado (valor +
     classe). E o lead estruturado que alimenta o fluxo de bot (Digisac):
     a mensagem chega rica, o bot resgata e puxa pro comercial.
   - UTMs de origem sao herdados por script.js (varre todos os wa.me).

   >>> PONTO DE INTEGRACAO REAL (futuro) <<<
   Quando o destino do lead estiver definido (CRM / GoSac / Digisac /
   endpoint proprio), enviar tambem um fetch(POST) com
   { imc, classe, peso, altura, utms } no ponto marcado abaixo, ANTES de
   abrir o WhatsApp. O resto do fluxo nao muda.
   ============================================================ */
(() => {
  "use strict";

  const form = document.getElementById("imc-form");
  if (!form) return;

  const WA = "https://wa.me/5514981540709";
  const CAMPAIGN = "emagrecimento";

  const out = document.getElementById("imc-result");
  const elValue = document.getElementById("imc-value");
  const elTag = document.getElementById("imc-tag");
  const elText = document.getElementById("imc-text");
  const elScaleFill = document.getElementById("imc-scale");
  // O gradiente e o marcador (::after) vivem no .imc-scale (pai); as
  // custom props --pos/--tone precisam ser setadas nele, nao no span.
  const elScale = elScaleFill ? elScaleFill.closest(".imc-scale") : null;
  const cta = document.getElementById("imc-cta");

  // Tracking silencioso (nao quebra se gtag/dataLayer nao existir ainda).
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: name }, params));
    }
  }

  // Monta wa.me com mensagem + UTM de conteudo. A origem real
  // (utm_source/medium da URL) e aplicada por script.js depois do load.
  function waLink(content, message) {
    const url = new URL(WA);
    url.searchParams.set("text", message);
    url.searchParams.set("utm_source", "site");
    url.searchParams.set("utm_medium", "cta");
    url.searchParams.set("utm_campaign", CAMPAIGN);
    url.searchParams.set("utm_content", content);
    return url.toString();
  }

  function num(el) {
    const v = parseFloat(String(el.value).replace(",", "."));
    return Number.isFinite(v) ? v : NaN;
  }

  function flash(input) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
    window.setTimeout(() => input.removeAttribute("aria-invalid"), 2400);
  }

  // Faixa OMS. tone alimenta as cores; min/max posicionam o marcador.
  function classify(imc) {
    if (imc < 18.5) return { tag: "Abaixo do peso", tone: "low", msg: "seu IMC indica peso abaixo da faixa de referência" };
    if (imc < 25) return { tag: "Peso adequado", tone: "ok", msg: "seu IMC está na faixa de referência" };
    if (imc < 30) return { tag: "Sobrepeso", tone: "warn", msg: "seu IMC indica sobrepeso" };
    if (imc < 35) return { tag: "Obesidade grau I", tone: "high", msg: "seu IMC indica obesidade grau I" };
    if (imc < 40) return { tag: "Obesidade grau II", tone: "high", msg: "seu IMC indica obesidade grau II" };
    return { tag: "Obesidade grau III", tone: "high", msg: "seu IMC indica obesidade grau III" };
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const peso = num(form.peso);
    const alturaCm = num(form.altura);
    if (!(peso >= 30 && peso <= 350)) return flash(form.peso);
    if (!(alturaCm >= 120 && alturaCm <= 230)) return flash(form.altura);

    const m = alturaCm / 100;
    const imc = peso / (m * m);
    const imcR = Math.round(imc * 10) / 10;
    const c = classify(imc);

    elValue.textContent = imcR.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    elTag.textContent = c.tag;
    elTag.dataset.tone = c.tone;
    elText.textContent = `Com ${peso.toLocaleString("pt-BR")} kg e ${alturaCm} cm, ${c.msg}. O IMC não separa músculo de gordura — a leitura completa vem da bioimpedância na avaliação presencial.`;

    // Posicao na escala visual de 15 a 40.
    if (elScale) {
      const pct = Math.max(0, Math.min(100, ((imc - 15) / (40 - 15)) * 100));
      elScale.style.setProperty("--pos", pct.toFixed(1) + "%");
      elScale.dataset.tone = c.tone;
    }

    // >>> INTEGRACAO REAL ENTRA AQUI <<<
    // Ex.: fetch("/api/lead", { method:"POST",
    //   headers:{"Content-Type":"application/json"},
    //   body: JSON.stringify({ imc: imcR, classe: c.tag, peso, altura: alturaCm,
    //     utms: Object.fromEntries(new URLSearchParams(location.search)) }) });

    cta.href = waLink(
      "tool_imc",
      `Ola! Usei a calculadora de IMC do site e deu ${imcR.toString().replace(".", ",")} (${c.tag}). Quero entender o que isso significa no meu caso e como funciona a avaliacao.`
    );
    out.hidden = false;
    track("calc_imc", { imc: imcR, classe: c.tag });
  });
})();
