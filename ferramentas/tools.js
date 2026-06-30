/* ============================================================
   CALCULADORAS RENOVE — IMC, TDEE (Mifflin-St Jeor) e meta de peso.
   100% client-side, sem backend. Cada resultado abre um CTA de
   WhatsApp com mensagem contextual e UTMs (script.js cuida da
   herança de origem nos links wa.me).

   Fórmulas (fonte: Mifflin-St Jeor, padrão clínico para nutrição):
     BMR homem  = 10*kg + 6.25*cm - 5*idade + 5
     BMR mulher = 10*kg + 6.25*cm - 5*idade - 161
     TDEE       = BMR * fator de atividade
   IMC = kg / (m^2), faixas OMS.
   ============================================================ */
(() => {
  "use strict";

  const WA = "https://wa.me/5514981540709";
  const CAMPAIGN = "ferramentas";

  // ---------------------------------------------------- ABAS (tab controller)
  // Transforma a trilha (5 cards de rota) num seletor de abas REAL: uma
  // ferramenta visível por vez. Sem JS, todas as secoes ficam visiveis
  // (fallback + SEO). Com JS, colapsa o scroll gigante de 10.000px em uma
  // ferramenta por vez e a trilha vira navegacao de verdade.
  (() => {
    const map = document.querySelector(".tools-route-map");
    if (!map) return;
    const steps = [...map.querySelectorAll(".route-step")];
    const links = steps.map((s) => s.querySelector("a")).filter(Boolean);
    const panels = links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    if (panels.length !== links.length || !panels.length) return;

    document.body.classList.add("tools-tabbed");
    map.setAttribute("role", "tablist");
    map.setAttribute("aria-label", "Escolha uma ferramenta");

    function activate(idx, focus) {
      links.forEach((a, i) => {
        const on = i === idx;
        a.setAttribute("role", "tab");
        a.setAttribute("aria-selected", on ? "true" : "false");
        a.setAttribute("tabindex", on ? "0" : "-1");
        steps[i].classList.toggle("is-active", on);
      });
      panels.forEach((p, i) => {
        const on = i === idx;
        p.hidden = !on;
        p.classList.toggle("is-active", on);
        // Re-dispara a transicao de entrada ao trocar de aba (continuidade
        // visual em vez de "trocou seco"). Respeita reduced-motion via CSS.
        if (on) {
          p.style.animation = "none";
          void p.offsetWidth; // reflow
          p.style.animation = "";
        }
      });
      if (focus && links[idx]) links[idx].focus();
      const name = links[idx].querySelector(".route-name");
      track("tool_tab", { tool: name ? name.textContent.trim() : String(idx) });
    }

    links.forEach((a, i) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        activate(i, false);
        // Rola a area de ferramentas pro topo, sem somir com a trilha.
        const panelsTop = document.querySelector(".tools-route");
        if (panelsTop) panelsTop.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      a.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % links.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + links.length) % links.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = links.length - 1;
        if (next !== null) {
          e.preventDefault();
          activate(next, true);
        }
      });
    });

    // Abre a aba pedida pela URL (#calc-imc etc.) ou a primeira.
    const fromHash = links.findIndex((a) => a.getAttribute("href") === location.hash);
    activate(fromHash >= 0 ? fromHash : 0, false);
  })();

  // Tracking opcional — silencioso se gtag/dataLayer ainda não existir.
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: name }, params));
    }
  }

  // Monta um link wa.me com mensagem + UTM de conteúdo. A herança de
  // origem (utm_source/medium reais da URL) é aplicada por script.js,
  // que varre todos os links wa.me depois do carregamento.
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

  function flash(input, formEl) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
    window.setTimeout(() => input.removeAttribute("aria-invalid"), 2400);
  }

  function show(out) {
    out.hidden = false;
  }

  // Rola suavemente ate o resultado recem-revelado. Respeita reduced-motion.
  // Sem isto, no mobile o resultado nasce abaixo da dobra e parece "nada
  // aconteceu" — perda direta de conversao.
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function reveal(out) {
    out.hidden = false;
    out.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

  // ---------------------------------------------------------- IMC
  (() => {
    const form = document.getElementById("imc-form");
    if (!form) return;
    const out = document.getElementById("imc-result");
    const elValue = document.getElementById("imc-value");
    const elTag = document.getElementById("imc-tag");
    const elText = document.getElementById("imc-text");
    const elScaleFill = document.getElementById("imc-scale");
    // O marcador e o gradiente vivem no .tool-scale (pai); --pos/--tone
    // precisam ser setados nele, nao no span interno (custom props so
    // herdam pra baixo, nunca pra cima).
    const elScale = elScaleFill ? elScaleFill.closest(".tool-scale") : null;
    const cta = document.getElementById("imc-cta");

    // Faixa OMS. min/max usados para posicionar o marcador na escala 15–40.
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
      // Faixa de peso de referencia para a altura informada (IMC 18,5–24,9):
      // transforma o numero abstrato em algo acionavel e amarra no pitch.
      const pesoMin = Math.round(18.5 * m * m);
      const pesoMax = Math.round(24.9 * m * m);
      elText.textContent = `Com ${peso.toLocaleString("pt-BR")} kg e ${alturaCm} cm, ${c.msg}. Para a sua altura, a faixa de referência é de ${pesoMin} a ${pesoMax} kg. O IMC não separa músculo de gordura — a leitura completa vem da bioimpedância na avaliação.`;

      // Posição na escala visual de 15 a 40.
      const pct = Math.max(0, Math.min(100, ((imc - 15) / (40 - 15)) * 100));
      elScale.style.setProperty("--pos", pct.toFixed(1) + "%");
      elScale.dataset.tone = c.tone;

      cta.href = waLink(
        "tool_imc",
        `Ola! Usei a calculadora de IMC do site e deu ${imcR.toString().replace(".", ",")} (${c.tag}). Quero entender o que isso significa no meu caso e como funciona a avaliacao.`
      );
      reveal(out);
      track("calc_imc", { imc: imcR, classe: c.tag });
    });
  })();

  // ---------------------------------------------------------- TDEE
  (() => {
    const form = document.getElementById("tdee-form");
    if (!form) return;
    const out = document.getElementById("tdee-result");
    const elValue = document.getElementById("tdee-value");
    const elText = document.getElementById("tdee-text");
    const elBmr = document.getElementById("tdee-bmr");
    const elMaintain = document.getElementById("tdee-maintain");
    const elDeficit = document.getElementById("tdee-deficit");
    const elProtein = document.getElementById("tdee-protein");
    const cta = document.getElementById("tdee-cta");

    const kcal = (n) => Math.round(n).toLocaleString("pt-BR") + " kcal";

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const sexo = form.sexo.value;
      const idade = num(form.idade);
      const peso = num(form.peso);
      const alturaCm = num(form.altura);
      const fator = num(form.atividade);
      if (!(idade >= 14 && idade <= 100)) return flash(form.idade);
      if (!(peso >= 30 && peso <= 350)) return flash(form.peso);
      if (!(alturaCm >= 120 && alturaCm <= 230)) return flash(form.altura);

      // Mifflin-St Jeor
      const base = 10 * peso + 6.25 * alturaCm - 5 * idade;
      const bmr = sexo === "m" ? base + 5 : base - 161;
      const tdee = bmr * fator;
      // Deficit moderado ~0,5 kg/semana, com piso de seguranca: nunca abaixo
      // de ~1200 (mulher) / ~1500 (homem) kcal. Protege credibilidade e
      // compliance — valores muito baixos pedem supervisao.
      const pisoSeguro = sexo === "m" ? 1500 : 1200;
      const deficitBruto = tdee - 500;
      const deficit = Math.max(deficitBruto, pisoSeguro);
      const noPiso = deficitBruto < pisoSeguro;
      // Proteina sugerida ~1,6 g/kg (educativo, refinado na avaliacao).
      const protein = Math.round(peso * 1.6);

      elValue.textContent = Math.round(tdee).toLocaleString("pt-BR");
      elBmr.textContent = kcal(bmr);
      elMaintain.textContent = kcal(tdee);
      elDeficit.textContent = kcal(deficit);
      if (elProtein) elProtein.textContent = protein.toLocaleString("pt-BR") + " g/dia";
      elText.textContent = noPiso
        ? `Estimativa pela equação Mifflin-St Jeor. No seu caso, um déficit grande deixaria as calorias muito baixas — por isso o valor seguro pede supervisão. A proteína sugerida (~1,6 g/kg) é educativa; a meta real é definida na avaliação.`
        : `Estimativa pela equação Mifflin-St Jeor. Para emagrecer de forma gradual, um ponto de partida comum é um déficit em torno de 500 kcal/dia. A proteína sugerida (~1,6 g/kg) é educativa — o valor seguro pra você depende de composição corporal e exames, definidos na avaliação.`;

      cta.href = waLink(
        "tool_tdee",
        `Ola! Calculei meu gasto calorico diario no site: cerca de ${Math.round(tdee).toLocaleString("pt-BR")} kcal/dia. Quero montar um plano alimentar com a equipe.`
      );
      reveal(out);
      track("calc_tdee", { tdee: Math.round(tdee), bmr: Math.round(bmr) });
    });
  })();

  // ---------------------------------------------------------- META
  (() => {
    const form = document.getElementById("meta-form");
    if (!form) return;
    const out = document.getElementById("meta-result");
    const elValue = document.getElementById("meta-value");
    const elText = document.getElementById("meta-text");
    const cta = document.getElementById("meta-cta");
    const elJourney = document.getElementById("meta-journey");
    const jAtual = document.getElementById("meta-j-atual");
    const jMeta = document.getElementById("meta-j-meta");
    const jDelta = document.getElementById("meta-j-delta");

    function semanasParaTexto(semanas) {
      if (semanas < 8) return `cerca de ${Math.round(semanas)} semanas`;
      const meses = semanas / 4.345;
      if (meses < 12) return `cerca de ${Math.round(meses)} ${Math.round(meses) === 1 ? "mês" : "meses"}`;
      const anos = meses / 12;
      const anosR = Math.round(anos * 10) / 10;
      return `cerca de ${anosR.toString().replace(".", ",")} ${anosR <= 1 ? "ano" : "anos"}`;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const atual = num(form.atual);
      const desejado = num(form.desejado);
      const ritmo = num(form.ritmo); // kg/semana
      if (!(atual >= 35 && atual <= 350)) return flash(form.atual);
      if (!(desejado >= 35 && desejado <= 350)) return flash(form.desejado);

      const diff = atual - desejado;
      if (diff <= 0) {
        elValue.textContent = "Meta já alcançada";
        elText.textContent = "O peso desejado é igual ou maior que o atual. Se o objetivo é ganho de massa ou recomposição corporal, a equipe também pode ajudar — é só chamar.";
        cta.href = waLink("tool_meta", "Ola! Usei a calculadora de meta no site e quero conversar sobre recomposicao corporal / ganho de massa com acompanhamento.");
        if (elJourney) elJourney.hidden = true;
        reveal(out);
        track("calc_meta", { diff: 0 });
        return;
      }

      const semanas = diff / ritmo;
      const txt = semanasParaTexto(semanas);
      const diffR = Math.round(diff * 10) / 10;
      // Primeiro marco (~25% da meta): vitoria rapida percebida, justifica
      // o acompanhamento. Para metas grandes, enquadra como jornada por etapas.
      const marcoKg = Math.round(diff * 0.25 * 10) / 10;
      const marcoSem = Math.round((diff * 0.25) / ritmo);
      const jornadaLonga = semanas > 52;

      elValue.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
      let textoMeta = `Para perder ${diffR.toString().replace(".", ",")} kg num ritmo de ${ritmo.toString().replace(".", ",")} kg por semana. É uma estimativa linear — na vida real o ritmo oscila, e por isso o acompanhamento ajusta a rota.`;
      if (marcoKg >= 1) {
        textoMeta += ` Os primeiros ${marcoKg.toString().replace(".", ",")} kg (~25% da meta) costumam aparecer em torno de ${marcoSem} ${marcoSem === 1 ? "semana" : "semanas"} — o tipo de marco que mantém a motivação.`;
      }
      if (jornadaLonga) {
        textoMeta += ` É uma jornada longa: dividir em etapas, com acompanhamento, é o que torna sustentável.`;
      }
      elText.textContent = textoMeta;

      if (elJourney) {
        jAtual.textContent = atual.toLocaleString("pt-BR") + " kg";
        jMeta.textContent = desejado.toLocaleString("pt-BR") + " kg";
        jDelta.textContent = "−" + diffR.toString().replace(".", ",") + " kg";
        elJourney.hidden = false;
      }

      cta.href = waLink(
        "tool_meta",
        `Ola! Minha meta e perder cerca de ${diffR.toString().replace(".", ",")} kg. A calculadora do site estimou ${txt}. Quero um plano com acompanhamento pra chegar la com seguranca.`
      );
      reveal(out);
      track("calc_meta", { diff: diffR, semanas: Math.round(semanas) });
    });
  })();

  // ---------------------------------------------------------- QUIZ DE PRONTIDÃO
  // Seis perguntas, cada uma de 0 a 2 pontos (máx. 12). A pontuação vira
  // um de três perfis. Não é diagnóstico — é um retrato do momento para
  // contextualizar a conversa no WhatsApp. 100% client-side.
  (() => {
    const form = document.getElementById("quiz-form");
    if (!form) return;
    const out = document.getElementById("quiz-result");
    const elTag = document.getElementById("quiz-tag");
    const elText = document.getElementById("quiz-text");
    const elScale = document.getElementById("quiz-scale");
    const cta = document.getElementById("quiz-cta");
    const QS = ["q1", "q2", "q3", "q4", "q5", "q6"];

    function perfil(score) {
      // 0–4: precisa de mais cuidado/segurança; 5–8: pronto com dúvidas;
      // 9–12: pronto e organizado. Tom acolhedor, sem julgamento.
      if (score <= 4) {
        return {
          tone: "high",
          tag: "Momento de cuidar com apoio",
          text: "Pelo seu retrato, faz sentido começar com uma avaliação atenta antes de qualquer plano — entender sono, energia, histórico e o que já tentou. Não é recomeçar do zero: é finalmente ter alguém lendo o seu caso por inteiro. A avaliação presencial é o lugar certo pra isso.",
          msg: "Ola! Fiz o quiz de prontidao no site e quero comecar com uma avaliacao atenta do meu caso, entendendo meu historico antes de qualquer plano.",
          cta: "Quero entender meu caso, sem compromisso",
        };
      }
      if (score <= 8) {
        return {
          tone: "warn",
          tag: "Pronta(o), com dúvidas a esclarecer",
          text: "Você está num bom momento pra começar, mas com perguntas legítimas no caminho. Uma avaliação presencial resolve as dúvidas e define um plano que cabe na sua rotina, com médica e nutricionista olhando os seus números de verdade.",
          msg: "Ola! Fiz o quiz de prontidao no site e me sinto pronta(o) pra comecar, mas tenho algumas duvidas. Quero agendar uma avaliacao pra esclarecer e montar um plano.",
          cta: "Tirar minhas dúvidas numa avaliação",
        };
      }
      return {
        tone: "ok",
        tag: "Pronta(o) para um plano estruturado",
        text: "Seu retrato mostra clareza e prontidão. O próximo passo natural é transformar isso num plano estruturado e sustentável, com acompanhamento que ajusta a rota ao longo do caminho. A avaliação presencial define os detalhes do seu caso.",
        msg: "Ola! Fiz o quiz de prontidao no site e me sinto pronta(o) pra um plano estruturado. Quero agendar a avaliacao pra comecar com acompanhamento.",
        cta: "Quero agendar minha avaliação",
      };
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let score = 0;
      for (const q of QS) {
        const checked = form.querySelector(`input[name="${q}"]:checked`);
        if (!checked) {
          // Marca a pergunta não respondida e leva o foco até ela.
          const first = form.querySelector(`input[name="${q}"]`);
          const fs = first ? first.closest("fieldset") : null;
          if (fs) {
            fs.setAttribute("data-invalid", "true");
            fs.scrollIntoView({ behavior: "smooth", block: "center" });
            window.setTimeout(() => fs.removeAttribute("data-invalid"), 2400);
          }
          if (first) first.focus();
          return;
        }
        score += parseInt(checked.value, 10) || 0;
      }

      const p = perfil(score);
      elTag.textContent = p.tag;
      elTag.dataset.tone = p.tone;
      elText.textContent = p.text;
      // Regua de prontidao 0–12: da corpo ao resultado e valoriza o esforco
      // das 6 perguntas. Posiciona o marcador conforme o score.
      if (elScale) {
        const pct = Math.max(4, Math.min(96, (score / 12) * 100));
        elScale.style.setProperty("--pos", pct.toFixed(1) + "%");
        elScale.dataset.tone = p.tone;
      }
      cta.textContent = p.cta;
      cta.href = waLink("tool_quiz", p.msg);
      reveal(out);
      track("quiz_perfil", { score: score, perfil: p.tag });
    });
  })();

  // ---------------------------------------------------- CHECKLIST
  // Lead magnet leve: a paciente marca o que quer levar/comentar na
  // avaliação; geramos um resumo que ela leva pro WhatsApp. Sem
  // diagnóstico, sem fármaco, sem promessa — só organização pré-consulta.
  (() => {
    const form = document.getElementById("check-form");
    if (!form) return;
    const out = document.getElementById("check-result");
    const elText = document.getElementById("check-text");
    const elTag = document.getElementById("check-tag");
    const elList = document.getElementById("check-list");
    const elDuvida = document.getElementById("check-duvida");
    const cta = document.getElementById("check-cta");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const marcados = [...form.querySelectorAll('input[name="check"]:checked')]
        .map((i) => i.value);
      const duvida = elDuvida && elDuvida.value.trim();

      if (!marcados.length && !duvida) {
        // Nada marcado: sinaliza o primeiro grupo e leva o foco até ele.
        const fs = form.querySelector("fieldset");
        if (fs) {
          fs.setAttribute("data-invalid", "true");
          fs.scrollIntoView({ behavior: "smooth", block: "center" });
          window.setTimeout(() => fs.removeAttribute("data-invalid"), 2400);
          const first = fs.querySelector("input");
          if (first) first.focus();
        }
        return;
      }

      // Lista visível na página.
      elList.innerHTML = "";
      marcados.forEach((txt) => {
        const li = document.createElement("li");
        li.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
        elList.appendChild(li);
      });
      if (duvida) {
        const li = document.createElement("li");
        li.textContent = "Dúvida principal: " + duvida;
        elList.appendChild(li);
      }

      elText.textContent =
        "Esse é o seu roteiro pra avaliação. Toque no botão e ele já vai " +
        "montado na conversa com a Renove — é só enviar.";

      // Mensagem do WhatsApp (sem acentos, padrão do projeto).
      let msg = "Ola! Montei meu checklist no site pra avaliacao presencial. Pretendo levar/comentar: ";
      const itens = marcados.length
        ? marcados.join("; ")
        : "ainda organizando os pontos";
      msg += itens + ".";
      if (duvida) msg += " Minha duvida principal: " + duvida;
      cta.href = waLink("tool_checklist", msg);

      const total = marcados.length + (duvida ? 1 : 0);
      if (elTag) elTag.textContent = `Seu roteiro tem ${total} ${total === 1 ? "ponto" : "pontos"}`;
      reveal(out);
      track("checklist_montado", { itens: marcados.length, tem_duvida: !!duvida });

      // Botão copiar checklist — wires up after each render so it has fresh items.
      const copyBtn = document.getElementById("check-copy");
      if (copyBtn) {
        // Remove old listener by replacing node (prevents duplicates across re-submits).
        const fresh = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(fresh, copyBtn);
        fresh.addEventListener("click", () => {
          const lines = [...elList.querySelectorAll("li")]
            .map((li) => "• " + li.textContent)
            .join("\n");
          const text = "Meu checklist para a avaliação Renove:\n" + lines;
          navigator.clipboard
            .writeText(text)
            .then(() => {
              fresh.dataset.state = "copied";
              const original = fresh.textContent.trim();
              fresh.textContent = fresh.dataset.copied || "Copiado!";
              window.setTimeout(() => {
                fresh.dataset.state = "";
                fresh.innerHTML =
                  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V3a1 1 0 0 1 1-1h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Copiar lista';
              }, 2000);
            })
            .catch(() => {
              // Fallback: select a temp textarea.
              const ta = document.createElement("textarea");
              ta.value = text;
              ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              fresh.dataset.state = "copied";
              fresh.textContent = fresh.dataset.copied || "Copiado!";
              window.setTimeout(() => {
                fresh.dataset.state = "";
                fresh.innerHTML =
                  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V3a1 1 0 0 1 1-1h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Copiar lista';
              }, 2000);
            });
        });
      }
    });
  })();
})();
