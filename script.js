/* ============================================================
   TRACKING GA4 — EVENTOS PERSONALIZADOS
   Dispara window.gtag() quando disponível (GA4 via GTM ou snippet
   direto). Se o GA4 ainda não estiver instalado, os eventos ficam
   em silêncio — sem erro, sem bloqueio.

   Eventos rastreados:
     whatsapp_click  → qualquer clique em link wa.me (inclui float + sticky)
     faq_expand      → abertura de qualquer <details> do FAQ
     pricing_view    → usuário passa pelo bloco de preço (Intersection)
     form_start      → foco no primeiro campo do lead-form
   ============================================================ */
function ga4(name, params) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

// --- whatsapp_click ----------------------------------------
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="https://wa.me/"]');
  if (!link) return;
  const url = new URL(link.href);
  ga4("whatsapp_click", {
    cta_label: link.textContent.trim().slice(0, 60) || link.getAttribute("aria-label") || "unknown",
    utm_content: url.searchParams.get("utm_content") || "unknown",
    utm_campaign: url.searchParams.get("utm_campaign") || "unknown",
  });
});

// --- faq_expand --------------------------------------------
document.querySelectorAll(".faq-list details").forEach((det) => {
  det.addEventListener("toggle", () => {
    if (det.open) {
      const q = det.querySelector("summary");
      ga4("faq_expand", {
        question: q ? q.textContent.trim().slice(0, 80) : "unknown",
      });
    }
  });
});

// --- pricing_view (observa o primeiro bloco de preço) ------
(() => {
  const priceEl =
    document.querySelector(".pricing-highlight") ||
    document.querySelector("[class*=price]") ||
    document.querySelector(".service-card");
  if (!priceEl || typeof IntersectionObserver === "undefined") return;
  let fired = false;
  new IntersectionObserver(
    (entries) => {
      if (!fired && entries[0].isIntersecting) {
        fired = true;
        ga4("pricing_view", { section: priceEl.closest("section")?.id || "unknown" });
      }
    },
    { threshold: 0.4 }
  ).observe(priceEl);
})();

// --- form_start --------------------------------------------
(() => {
  const form = document.getElementById("lead-form");
  if (!form) return;
  let started = false;
  form.addEventListener("focusin", () => {
    if (started) return;
    started = true;
    ga4("form_start", { form_id: "lead-form" });
  });
})();

const menuButton = document.querySelector(".menu-button");

if (menuButton) {
  menuButton.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

/* ============================================================
   BOTAO FLUTUANTE DE WHATSAPP
   Sugestao do Henrique. Criado antes do encaminhamento de UTM
   para herdar o tracking automaticamente como qualquer CTA.
   Escondido em mobile (<768px), onde ja existe a barra sticky.
   ============================================================ */
(() => {
  if (document.querySelector(".wa-float")) return;

  const link = document.createElement("a");
  link.className = "wa-float";
  link.href =
    "https://wa.me/5514981540709?text=Ola%2C%20vim%20pelo%20site%20da%20Renove%20Clinic%20e%20quero%20agendar%20minha%20avaliacao.&utm_source=site&utm_medium=float&utm_campaign=atlas_site&utm_content=whatsapp_float";
  link.setAttribute("aria-label", "Falar no WhatsApp com a Renove Clinic");
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML =
    '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2c-5.46 0-9.9 4.43-9.9 9.9 0 1.74.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.43 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm5.8 14.07c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.97-1.28-4.9-4.27-5.05-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.78-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.25.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.39-.25.66-.15.27.1 1.7.8 2 .95.3.15.5.22.57.35.07.12.07.71-.18 1.4Z"/></svg>' +
    '<span class="wa-float-label">Fale conosco</span>';
  document.body.appendChild(link);
})();

const pageParams = new URLSearchParams(window.location.search);
// Chaves de ORIGEM: descrevem COMO o visitante chegou. Quando a URL real
// traz essas chaves, ela e a autoridade e sobrescreve qualquer valor fixo
// no link (evita que trafego organico/direto seja contado como google/cpc).
const originKeys = ["utm_source", "utm_medium", "utm_campaign", "gclid", "gbraid", "wbraid"];
// Chaves de BOTAO: descrevem QUAL elemento foi clicado. O valor do link e o
// correto; so herdamos da URL quando o link nao define.
const buttonKeys = ["utm_content", "utm_term"];

document.querySelectorAll('a[href^="https://wa.me/5514981540709"]').forEach((link) => {
  const url = new URL(link.href);
  const linkParams = new URLSearchParams(url.search);

  for (const key of originKeys) {
    if (pageParams.has(key)) {
      linkParams.set(key, pageParams.get(key));
    }
  }
  for (const key of buttonKeys) {
    if (pageParams.has(key) && !linkParams.has(key)) {
      linkParams.set(key, pageParams.get(key));
    }
  }

  url.search = linkParams.toString();
  link.href = url.toString();
});

/* ============================================================
   FORMULARIO DE CAPTURA DE LEAD
   Estrategia atual (sem backend): o form valida nome + WhatsApp,
   monta uma mensagem personalizada e abre o WhatsApp da clinica ja
   preenchido, herdando os mesmos UTMs dos demais CTAs. Assim nenhum
   visitante que preenche "some": cai direto na conversa.

   >>> PONTO DE INTEGRACAO REAL <<<
   Quando o Joao definir o destino (CRM / GoSac / Formspree / endpoint
   proprio), enviar tambem um fetch(POST) com {name, phone, goal, utms}
   no ponto marcado abaixo, ANTES de abrir o WhatsApp. O resto do fluxo
   nao precisa mudar.
   ============================================================ */
(() => {
  const form = document.getElementById("lead-form");
  if (!form) return;

  const WA_BASE = "https://wa.me/5514981540709";
  const note = form.querySelector(".lead-note");

  const goalText = {
    emagrecimento: "Tenho interesse em emagrecimento com acompanhamento.",
    estetica: "Tenho interesse em harmonizacao / estetica.",
    ambos: "Tenho interesse em emagrecimento e tambem em estetica.",
  };

  // Coleta os UTMs vigentes (mesma fonte de verdade dos links).
  const collectUtms = () => {
    const p = new URLSearchParams(window.location.search);
    const keep = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gbraid", "wbraid"];
    const out = new URLSearchParams();
    for (const k of keep) if (p.has(k)) out.set(k, p.get(k));
    // Defaults proprios deste form quando a URL nao traz origem.
    if (!out.has("utm_source")) out.set("utm_source", "site");
    if (!out.has("utm_medium")) out.set("utm_medium", "cta");
    if (!out.has("utm_campaign")) out.set("utm_campaign", "atlas_home");
    out.set("utm_content", "lead_form");
    return out;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    const goal = form.elements.goal.value;

    if (name.length < 2) {
      note.textContent = "Pode colocar seu nome pra gente te chamar direito?";
      form.elements.name.focus();
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      note.textContent = "Confere o WhatsApp com DDD, por favor.";
      form.elements.phone.focus();
      return;
    }

    const lines = [
      `Ola! Sou ${name} e vim pelo site da Renove Clinic.`,
      goalText[goal] || "Quero entender a avaliacao presencial.",
      `Meu WhatsApp: ${phone}.`,
    ];
    const message = lines.join(" ");

    // >>> INTEGRACAO REAL ENTRA AQUI <<<
    // Ex.: fetch("/api/lead", {method:"POST", headers:{"Content-Type":"application/json"},
    //   body: JSON.stringify({ name, phone, goal, utms: Object.fromEntries(collectUtms()) })});

    const url = new URL(WA_BASE);
    const params = collectUtms();
    params.set("text", message);
    url.search = params.toString();

    note.textContent = "Boa! Abrindo o WhatsApp pra finalizar...";
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  });
})();

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

/* ============================================================
   MOTION LAYER — progressive enhancement
   So liga quando o usuario nao pediu menos movimento. Tudo aqui
   e decorativo: se falhar, o conteudo permanece 100% visivel.
   ============================================================ */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;

  // Marca que o motion-layer esta ativo (CSS depende disso).
  root.classList.add("js-motion");

  // --- Stagger de entrada do hero ---
  const heroItems = document.querySelectorAll(".hero-copy > *, .hero-visual");
  heroItems.forEach((el, i) => el.style.setProperty("--hero-i", String(i)));

  // --- Barra de progresso de leitura ---
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  const header = document.querySelector(".site-header");
  let ticking = false;

  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
    progress.style.setProperty("--progress", String(ratio));
    if (header) header.classList.toggle("is-condensed", doc.scrollTop > 24);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  // --- Spotlight removido: o CSS que consumia --mx/--my nao existe mais.
  //     Manter os listeners so custava getBoundingClientRect() por
  //     pointermove (layout thrash) sem nenhum efeito visual.

  // --- Scroll-reveal com stagger ---
  if (reduceMotion.matches) return; // entrada/aurora ja neutralizadas via CSS

  const revealGroups = [
    ".decision-rail article",
    ".atlas-map article",
    ".care-grid article",
    ".service-tile",
    ".comparison > div",
    ".section-heading",
    ".cta-section > div",
    ".plan-ladder .plan-card",
    ".credential-section article",
    ".faq-list details",
    ".timeline-section article",
    ".fit-grid .fit-card",
    ".diff-grid .diff-item",
    ".pillars-grid .pillar-card",
    ".team-grid .team-card",
    ".service-grid-section .hof-card",
    ".signal-row span",
    ".copy-columns p",
    ".map-section",
    ".contact-info-section article",
    ".legal-block",
  ];

  const revealEls = [];
  revealGroups.forEach((selector) => {
    const group = document.querySelectorAll(selector);
    group.forEach((el, i) => {
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-delay", `${Math.min(i, 5) * 70}ms`);
      revealEls.push(el);
    });
  });

  if (!("IntersectionObserver" in window) || revealEls.length === 0) {
    // Fallback: mostra tudo de imediato.
    revealEls.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  revealEls.forEach((el) => observer.observe(el));
  window.setTimeout(() => {
    revealEls.forEach((el) => el.classList.add("is-revealed"));
  }, 1200);

  /* ---- Count-up dos números de prova (FATIA 4) ----
     Anima do 0 ao valor final quando o número entra na viewport.
     reduceMotion já retornou acima, então aqui o movimento é permitido.
     O texto final fica no HTML como fallback (sem JS, mostra o número certo). */
  const countEls = document.querySelectorAll(".count-up[data-count-to]");
  if (countEls.length) {
    const fmt = (val, decimals) => {
      const s = decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
      return s.replace(".", ","); // pt-BR
    };
    const runCount = (el) => {
      const to = parseFloat(el.getAttribute("data-count-to"));
      const decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      const suffix = el.getAttribute("data-count-suffix") || "";
      if (!Number.isFinite(to)) return;
      const dur = 1100;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = fmt(to * eased, decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(to, decimals) + suffix;
      };
      requestAnimationFrame(tick);
    };
    const countObs = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            runCount(entry.target);
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.6 }
    );
    countEls.forEach((el) => countObs.observe(el));
  }

  /* ---- Carrossel de depoimentos ---- */
  document.querySelectorAll("[data-testimonials]").forEach((root) => {
    const track = root.querySelector(".tc-track");
    const slides = Array.from(root.querySelectorAll(".testimonial-card"));
    const prev = root.querySelector(".tc-prev");
    const next = root.querySelector(".tc-next");
    const dotsWrap = root.querySelector(".tc-dots");
    if (!track || slides.length === 0) return;

    let index = 0;
    let order = slides.map((_, i) => i);
    let timer = null;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const autoplayMs = parseInt(root.dataset.autoplay || "0", 10);

    // ordem aleatória inicial (gira "random"), mantendo 1º slide previsível
    for (let i = order.length - 1; i > 1; i--) {
      const j = 1 + Math.floor(Math.random() * i);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const reordered = order.map((i) => slides[i]);
    reordered.forEach((s) => track.appendChild(s));

    // dots
    const dots = reordered.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "tc-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Depoimento " + (i + 1));
      dot.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(dot);
      return dot;
    });

    function render() {
      track.style.transform = "translateX(" + -index * 100 + "%)";
      dots.forEach((d, i) =>
        d.setAttribute("aria-selected", i === index ? "true" : "false")
      );
    }
    function goTo(i, user) {
      index = (i + reordered.length) % reordered.length;
      render();
      if (user) restart();
    }
    function start() {
      if (reduceMotion || !autoplayMs) return;
      timer = window.setInterval(() => goTo(index + 1), autoplayMs);
    }
    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }
    function restart() {
      stop();
      start();
    }

    if (prev) prev.addEventListener("click", () => goTo(index - 1, true));
    if (next) next.addEventListener("click", () => goTo(index + 1, true));
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    render();
    start();
  });
})();
