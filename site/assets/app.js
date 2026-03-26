/* eslint-disable no-alert */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const safeShowModal = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "true");
  };

  const safeClose = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
  };

  // Header nav (mobile)
  const nav = $("[data-nav]");
  const navToggle = $(".nav-toggle");
  const setNavOpen = (open) => {
    if (!nav || !navToggle) return;
    nav.dataset.open = open ? "true" : "false";
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  if (nav && navToggle) {
    navToggle.addEventListener("click", () => setNavOpen(nav.dataset.open !== "true"));
    $$("a[href^=\"#\"]", nav).forEach((a) => {
      a.addEventListener("click", () => setNavOpen(false));
    });
    document.addEventListener("click", (e) => {
      if (window.matchMedia("(max-width: 920px)").matches) {
        const isInside = nav.contains(e.target) || navToggle.contains(e.target);
        if (!isInside) setNavOpen(false);
      }
    });
    setNavOpen(false);
  }

  // Footer year
  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  // Lightbox
  const lightbox = $("[data-lightbox]");
  const lightboxImg = $("[data-lightbox-img]");
  const closeLightboxBtn = $("[data-close-lightbox]");

  const openLightbox = (src) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    safeShowModal(lightbox);
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    safeClose(lightbox);
    if (lightboxImg) lightboxImg.src = "";
  };

  $$("[data-open-lightbox]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-full");
      if (src) openLightbox(src);
    });
  });

  if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      // Close only when clicking the backdrop area (not the image).
      if (e.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeLightbox();
    });
  }

  // Leads (local-only for now)
  const STORAGE_KEY = "artist_site_leads_v1";

  const thanksDlg = $("[data-thanks]");
  const thanksText = $("[data-thanks-text]");
  const closeThanksBtn = $("[data-close-thanks]");
  const copyBtn = $("[data-copy-lead]");
  const copyHint = $("[data-copy-hint]");

  const form = $("[data-lead-form]");
  const fillDemoBtn = $("[data-fill-demo]");

  const getField = (name) => (form ? form.elements.namedItem(name) : null);
  const errElFor = (name) => $(`[data-error-for="${name}"]`, form || document);

  const setError = (name, message) => {
    const input = getField(name);
    const errEl = errElFor(name);
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errEl) errEl.textContent = message || "";
  };

  const validate = () => {
    if (!form) return false;
    let ok = true;
    const name = String(getField("name")?.value || "").trim();
    const contact = String(getField("contact")?.value || "").trim();

    if (!name) {
      ok = false;
      setError("name", "Введите имя.");
    } else {
      setError("name", "");
    }

    if (!contact) {
      ok = false;
      setError("contact", "Укажите, как с вами связаться.");
    } else {
      setError("contact", "");
    }

    return ok;
  };

  const loadLeads = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveLead = (lead) => {
    try {
      const list = loadLeads();
      list.unshift(lead);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
      return true;
    } catch {
      return false;
    }
  };

  const formatLeadText = (lead) => {
    const dt = new Date(lead.createdAt);
    const created = Number.isNaN(dt.getTime()) ? lead.createdAt : dt.toLocaleString("ru-RU");
    return [
      "Новая заявка с сайта-визитки",
      "",
      `Имя: ${lead.name}`,
      `Контакт: ${lead.contact}`,
      `Когда: ${created}`,
      "",
      "—",
      "Подсказка: можно ответить клиенту и уточнить тип работы, сроки и референсы.",
    ].join("\n");
  };

  // Later this can be replaced with real delivery (Telegram / email / etc.)
  const submitLead = async (lead) => {
    const ok = saveLead(lead);
    return { ok };
  };

  const openThanks = (text) => {
    if (thanksText) thanksText.value = text;
    if (copyHint) copyHint.textContent = "";
    safeShowModal(thanksDlg);
  };

  const closeThanks = () => safeClose(thanksDlg);
  if (closeThanksBtn) closeThanksBtn.addEventListener("click", closeThanks);
  if (thanksDlg) {
    thanksDlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeThanks();
    });
  }

  const copyToClipboard = async (text) => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const text = thanksText?.value || "";
      const ok = await copyToClipboard(text);
      if (copyHint) copyHint.textContent = ok ? "Скопировано в буфер обмена." : "Не удалось скопировать.";
    });
  }

  if (fillDemoBtn) {
    fillDemoBtn.addEventListener("click", () => {
      const name = getField("name");
      const contact = getField("contact");
      if (name) name.value = "Аня";
      if (contact) contact.value = "@example";
      validate();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const lead = {
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        name: String(getField("name")?.value || "").trim(),
        contact: String(getField("contact")?.value || "").trim(),
      };

      const res = await submitLead(lead);
      if (!res?.ok) {
        alert("Не удалось сохранить заявку. Попробуйте ещё раз.");
        return;
      }

      const text = formatLeadText(lead);
      openThanks(text);
      form.reset();
      setError("name", "");
      setError("contact", "");
    });

    ["input", "blur"].forEach((evt) => {
      form.addEventListener(evt, (e) => {
        if (!(e.target instanceof HTMLInputElement)) return;
        if (e.target.name === "name" || e.target.name === "contact") validate();
      });
    });
  }
})();
