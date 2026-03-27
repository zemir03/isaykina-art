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

  // Leads
  const STORAGE_KEY = "artist_site_leads_v1";
  const WORKER_URL = "https://isaykina-art-leads.zrvzir40.workers.dev";

  const thanksDlg = $("[data-thanks]");
  const closeThanksBtn = $$("[data-close-thanks]");

  const form = $("[data-lead-form]");
  const fillDemoBtn = $("[data-fill-demo]");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

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

  const isDeliveryConfigured = () =>
    WORKER_URL && WORKER_URL !== "YOUR_WORKER_URL";

  const sendLeadViaWorker = async (lead) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const dt = new Date(lead.createdAt);
    const created = Number.isNaN(dt.getTime()) ? lead.createdAt : dt.toLocaleString("ru-RU");

    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: lead.name, contact: lead.contact, created }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || "worker_error" };
    }
    return { ok: true };
  };

  const submitLead = async (lead) => {
    const saved = saveLead(lead);
    if (!saved) return { ok: false, reason: "local_save_failed" };
    if (!isDeliveryConfigured()) return { ok: false, reason: "not_configured" };

    try {
      const sent = await sendLeadViaWorker(lead);
      if (!sent.ok) return { ok: false, reason: "delivery_failed", error: sent.error };
    } catch (err) {
      return { ok: false, reason: "delivery_failed", error: err.message || String(err) };
    }
    return { ok: true };
  };

  const openThanks = () => safeShowModal(thanksDlg);

  const closeThanks = () => safeClose(thanksDlg);
  closeThanksBtn.forEach((btn) => btn.addEventListener("click", closeThanks));
  if (thanksDlg) {
    thanksDlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeThanks();
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
      if (!validate()) {
        alert("Заполни, пожалуйста, имя и контакт для связи.");
        return;
      }

      const prevBtnText = submitBtn?.textContent || "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправка...";
      }

      const lead = {
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        name: String(getField("name")?.value || "").trim(),
        contact: String(getField("contact")?.value || "").trim(),
      };

      const res = await submitLead(lead);
      if (!res?.ok) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = prevBtnText || "Отправить";
        }
        if (res?.reason === "not_configured") {
          alert(
            "Отправка не настроена: укажи WORKER_URL в assets/app.js (см. README)."
          );
        } else {
          alert(
            `Не удалось отправить заявку в Telegram.${res?.error ? `\nПричина: ${res.error}` : ""}`
          );
        }
        return;
      }

      openThanks();
      form.reset();
      setError("name", "");
      setError("contact", "");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevBtnText || "Отправить";
      }
    });

    ["input", "blur"].forEach((evt) => {
      form.addEventListener(evt, (e) => {
        if (!(e.target instanceof HTMLInputElement)) return;
        if (e.target.name === "name" || e.target.name === "contact") validate();
      });
    });
  }
})();
