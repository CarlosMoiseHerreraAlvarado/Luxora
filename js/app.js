(() => {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  const GENDER_LABEL = {
    h: "Hombre",
    m: "Mujer",
    u: "Unisex"
  };

  const BADGE_MAP = {
    bestseller: { text: "★ Más Vendido", cls: "badge--bestseller" },
    new: { text: "Nuevo", cls: "badge--new" },
    promo: { text: "Oferta", cls: "badge--promo" }
  };

  const CAT_PROFILE = {
    amber: { sillage: "Fuerte · Larga duración", mood: "Elegante y Nocturno", season: "Noche · Salidas · Otoño/Invierno" },
    woody: { sillage: "Alta fijación", mood: "Sofisticado y con porte", season: "Todo el año · Oficina y Eventos" },
    floral: { sillage: "Moderada a Alta", mood: "Fresco, Femenino y Fino", season: "Día · Primavera · Eventos" },
    fresh: { sillage: "Frescura duradera", mood: "Limpio y Energizante", season: "Uso Diario · Calor · Oficina" },
    gourmand: { sillage: "Muy potente", mood: "Dulce, Cálido y Seductor", season: "Citas · Fiesta · Noche" }
  };

  const GARMENT_SVGS = {
    blazer: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M32 16L20 24L14 78L26 80L30 38V86H70V38L74 80L86 78L80 24L68 16L50 42L32 16Z" fill="var(--swatch, #ebe5d9)" fill-opacity="0.45"/><path d="M32 16L50 42L68 16M50 42V86M38 14L50 24L62 14M46 54H48M46 64H48"/></svg>`,
    shirt: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M35 16L20 23L13 68L25 71L29 36V85H71V36L75 71L87 68L80 23L65 16L58 23H42L35 16Z" fill="var(--swatch, #f3efe6)" fill-opacity="0.5"/><path d="M35 16L43 27L50 22L57 27L65 16M50 22V85"/></svg>`,
    trousers: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M28 14H72L76 88H56L50 38L44 88H24L28 14Z" fill="var(--swatch, #b7ab9a)" fill-opacity="0.45"/><path d="M28 22H72M50 14V38M36 22L33 42M64 22L67 42"/></svg>`,
    dress: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M38 14L43 24H57L62 14L66 36L80 88H20L34 36L38 14Z" fill="var(--swatch, #dfd1bc)" fill-opacity="0.5"/><path d="M34 36H66M45 36L36 88M55 36L64 88"/></svg>`,
    tee: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M34 18C38 23 44 25 50 25C56 25 62 23 66 18L86 28L79 46L68 41V84H32V41L21 46L14 28L34 18Z" fill="var(--swatch, #ebe5d9)" fill-opacity="0.5"/></svg>`,
    hoodie: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M36 20C36 12 42 8 50 8C58 8 64 12 64 20L84 28L88 74L76 76L71 42V84H29V42L24 76L12 74L16 28L36 20Z" fill="var(--swatch, #cfc3b0)" fill-opacity="0.5"/><path d="M37 64H63L66 80H34L37 64ZM45 22V36M55 22V36"/></svg>`,
    sneaker: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M14 66L18 42L36 44L48 34L62 48L82 52C87 53 90 58 90 66V74H14V66Z" fill="var(--swatch, #f4f1ea)" fill-opacity="0.55"/><path d="M14 68H90M42 40L48 45M48 37L54 42"/></svg>`,
    cap: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"><path d="M22 56C22 36 35 24 54 24C71 24 82 36 82 56H22Z" fill="var(--swatch, #e8e2d5)" fill-opacity="0.55"/><path d="M12 56H84C84 61 78 63 66 63H24C16 63 12 60 12 56Z"/><path d="M54 24C46 32 44 44 44 56"/></svg>`
  };

  const norm = (s = "") =>
    String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const fmtMoney = (n) => {
    if (typeof n !== "number" || isNaN(n) || n <= 0) return null;
    return "$" + n.toLocaleString("es-MX", { maximumFractionDigits: 0 }) + " MXN";
  };

  // ---------- Catálogo Reactivo desde LuxoraDB ----------
  let ALL_ITEMS = [];
  let PERFUMES_LIST = [];
  let APPAREL_LIST = [];
  let ITEM_MAP = {};

  function reloadCatalogFromDB() {
    ALL_ITEMS = LuxoraDB.getAllProducts({ includeHidden: false }).map((item) => {
      const uid = item.id || item.uid;
      const defaultSize =
        item.dept === "apparel"
          ? item.sizes && item.sizes.includes("M")
            ? "M"
            : item.sizes && item.sizes[0]
            ? item.sizes[0]
            : "Unitalla"
          : item.sizeMl || "100 ml";
      const defaultColor =
        item.dept === "apparel"
          ? item.colors && item.colors[0]
            ? item.colors[0].name
            : "Estándar"
          : "";
      return {
        ...item,
        id: uid,
        uid,
        defaultSize,
        defaultColor,
        search: norm(
          `${item.name} ${item.brand} ${item.notes || ""} ${item.description || ""} ${item.family || ""} ${item.conc || ""} ${(item.sizes || []).join(" ")}`
        )
      };
    });

    PERFUMES_LIST = ALL_ITEMS.filter((x) => x.dept === "perfumes");
    APPAREL_LIST = ALL_ITEMS.filter((x) => x.dept === "apparel");
    ITEM_MAP = Object.fromEntries(ALL_ITEMS.map((item) => [item.uid, item]));

    $("#navPerfumeCount").textContent = PERFUMES_LIST.length;
    $("#navApparelCount").textContent = APPAREL_LIST.length;

    // Actualizar textos de configuración de la tienda
    const settings = LuxoraDB.getStoreSettings();
    $("#topAnnouncement").textContent = settings.announcement;
    $("#storeNameEl").textContent = settings.storeName;
    $("#footerStoreName").textContent = settings.storeName;
    $("#slogan").textContent = settings.storeTagline;
  }

  // ---------- Estado Global ----------
  const state = {
    dept: "perfumes",
    q: "",
    g: "all",
    tier: "all",
    cat: "all",
    brand: "all",
    sort: "curated",
    view: "grid"
  };

  // ---------- Estado de "Mi Bolsa de Pedido" ----------
  const STORAGE_KEY = "luxora_selection_v2";
  let tray = [];
  const activePrefs = new Set();

  function loadTray() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) {
        tray = saved.filter((entry) => entry && ITEM_MAP[entry.uid]);
      }
    } catch (_) {
      tray = [];
    }
  }

  function saveTray() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tray));
    } catch (_) {}
    updateTrayUI();
  }

  function isInTray(uid) {
    return tray.some((entry) => entry.uid === uid);
  }

  let toastTimer;
  function showToast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2400);
  }

  function toggleTrayItem(item, customOpts = {}) {
    if (item.status === "out_of_stock") {
      showToast("Este producto está marcado como agotado temporalmente.");
      return;
    }
    const idx = tray.findIndex((e) => e.uid === item.uid);
    if (idx >= 0 && !customOpts.forceUpdate) {
      tray.splice(idx, 1);
      showToast(`Quitaste "${item.name}" de tu bolsa`);
    } else {
      const entry = {
        uid: item.uid,
        size: customOpts.size || item.defaultSize || "",
        color: customOpts.color || item.defaultColor || ""
      };
      if (idx >= 0) tray[idx] = entry;
      else tray.push(entry);
      showToast(`✓ "${item.name}" agregado a Mi Bolsa`);
    }
    saveTray();
    renderCatalog();
  }

  // ---------- Enlaces de WhatsApp (+1 571 580-9800) ----------
  function getWhatsappNumber() {
    const s = LuxoraDB.getStoreSettings();
    const raw = (s.whatsapp || CONFIG.whatsapp || "15715809800").replace(/\D/g, "");
    if (!raw || raw === "520000000000") return "15715809800";
    // Si ingresaron los 10 dígitos de USA (5715809800) sin el código de país 1, anteponer 1
    if (raw.length === 10 && raw.startsWith("571")) return "1" + raw;
    return raw;
  }

  const waLink = (text) =>
    `https://wa.me/${getWhatsappNumber()}?text=${encodeURIComponent(text)}`;

  function singleItemMessage(item, opts = {}) {
    const priceStr = fmtMoney(item.price);
    const precioTxt = priceStr ? ` — Precio visto en tienda: *${priceStr}*` : "";

    if (item.dept === "apparel") {
      const size = opts.size || item.defaultSize || "Estándar";
      const color = opts.color || item.defaultColor || "Estándar";
      const tpl =
        CONFIG.singleApparelMessage ||
        "Hola, quiero pedir *{prenda}* ({marca}) en *Talla {talla}* y *Color {color}*{precioTxt}. ¿Está disponible?";
      return tpl
        .replace("{prenda}", item.name)
        .replace("{marca}", item.brand)
        .replace("{linea}", item.family || "")
        .replace("{talla}", size)
        .replace("{color}", color)
        .replace("{precioTxt}", precioTxt);
    }

    const pres = item.sizeMl ? `${item.conc || "EDP"} · ${item.sizeMl}` : item.conc || "Eau de Parfum";
    const tpl =
      CONFIG.singleMessage ||
      "Hola, quiero pedir o cotizar el perfume *{perfume}* de *{marca}* ({presentacion}){precioTxt}. ¿Tienen disponibilidad?";
    return tpl
      .replace("{perfume}", item.name)
      .replace("{marca}", item.brand)
      .replace("{presentacion}", pres)
      .replace("{familia}", item.family || pres)
      .replace("{precioTxt}", precioTxt);
  }

  function multiTrayMessage() {
    if (!tray.length) return CONFIG.consultMessage || "Hola, necesito ayuda en la tienda LUXORA.";
    let subtotal = 0;
    let pricedCount = 0;

    const lines = tray.map((entry, i) => {
      const item = ITEM_MAP[entry.uid];
      if (!item) return "";
      const pStr = fmtMoney(item.price);
      if (item.price && item.price > 0) {
        subtotal += item.price;
        pricedCount++;
      }
      const priceNote = pStr ? ` — *${pStr}*` : " — *(Por cotizar)*";

      if (item.dept === "apparel") {
        return `${i + 1}. *[Ropa]* *${item.name}* (${item.brand}) · Talla: *${entry.size}*, Color: *${entry.color}*${priceNote}`;
      }
      return `${i + 1}. *[Perfume]* *${item.name}* — ${item.brand} (${item.conc || "EDP"} ${item.sizeMl || "100 ml"})${priceNote}`;
    });

    let msg =
      (CONFIG.multiMessageHeader || "Hola, quiero realizar el siguiente pedido en *LUXORA*:\n\n") +
      lines.join("\n");

    if (pricedCount > 0) {
      msg += `\n\n*Subtotal productos con precio:* ${fmtMoney(subtotal)}`;
    }
    if (activePrefs.size > 0) {
      msg += `\n*Opciones solicitadas:* ${Array.from(activePrefs).join(" · ")}.`;
    }
    msg +=
      CONFIG.multiMessageFooter ||
      "\n\n¿Me confirman disponibilidad, total y formas de pago/entrega por favor?";
    return msg;
  }

  // ---------- Renderizado Visual ----------
  function renderMedia(item, colorHex) {
    if (item.img) {
      return `<img src="${item.img}" alt="${item.brand} — ${item.name}" loading="lazy" />`;
    }
    const hex = colorHex || (item.colors && item.colors[0] ? item.colors[0].hex : "#ebe5d9");
    const svg = GARMENT_SVGS[item.silhouette] || GARMENT_SVGS.tee;
    return `
      <div class="garment-art" style="--swatch:${hex}">
        ${svg}
        <span class="garment-art__tag">${item.family || "Ropa"}</span>
      </div>`;
  }

  // ---------- Showcase de Más Vendidos en el Hero (100% Dinámico desde Firebase) ----------
  function renderHeroShowcase() {
    const container = $("#heroShowcase");
    if (!container) return;

    const source = state.dept === "perfumes" ? PERFUMES_LIST : APPAREL_LIST;
    if (!source.length) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem 1.25rem; text-align: center; color: var(--muted); border: 1px dashed var(--border); border-radius: 10px;">
          ${
            !LuxoraDB.isLoaded()
              ? "Sincronizando productos en tiempo real desde Firebase…"
              : "Aún no hay productos publicados en este departamento."
          }
        </div>`;
      return;
    }

    const featured = source.filter(
      (p) => p.badge === "bestseller" || p.badge === "new" || p.badge === "promo"
    );
    const others = source.filter((p) => !featured.includes(p));
    const picks = [...featured, ...others].slice(0, 4);

    container.innerHTML = picks
      .map((item) => {
        const pStr = fmtMoney(item.price) || "Cotizar en 1 clic";
        return `
        <article class="showcase-item" data-open-uid="${item.uid}" tabindex="0" role="button">
          <div class="showcase-item__top">
            <span class="showcase-item__top-tag">★ Destacado</span>
            <span>${GENDER_LABEL[item.g] || "Unisex"}</span>
          </div>
          <div class="showcase-item__media">
            ${renderMedia(item)}
          </div>
          <div>
            <p class="showcase-item__brand">${item.brand}</p>
            <h3 class="showcase-item__name">${item.name}</h3>
            <p class="showcase-item__price">${pStr}</p>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderFooterBrands() {
    const box = $("#footerDynamicBrands");
    if (!box) return;
    const counts = {};
    ALL_ITEMS.forEach((p) => {
      if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    const topBrands = Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .slice(0, 6);

    if (!topBrands.length) {
      box.innerHTML = `<span style="font-size:0.8rem;color:var(--muted)">Catálogo en línea</span>`;
      return;
    }

    box.innerHTML = topBrands
      .map(
        (b) =>
          `<button type="button" class="footer__filter-link" data-quick-brand="${b}">${b}</button>`
      )
      .join("");
  }

  // ---------- Contadores de Categorías ----------
  function updateCompassCounts() {
    const cats = ["all", "amber", "woody", "floral", "fresh", "gourmand"];
    cats.forEach((c) => {
      const el = $(`[data-cat-count="${c}"]`);
      if (!el) return;
      const n =
        c === "all"
          ? PERFUMES_LIST.length
          : PERFUMES_LIST.filter((p) => p.cat === c).length;
      el.textContent = `${n} ${n === 1 ? "perfume" : "perfumes"}`;
    });

    const subcats = ["all", "camisas", "sacos", "playeras", "pantalones", "sneakers"];
    subcats.forEach((sc) => {
      const el = $(`[data-subcat-count="${sc}"]`);
      if (!el) return;
      let n = APPAREL_LIST.length;
      if (sc === "playeras") {
        n = APPAREL_LIST.filter((p) => p.subcat === "playeras" || p.subcat === "hoodies").length;
      } else if (sc === "pantalones") {
        n = APPAREL_LIST.filter((p) => p.subcat === "pantalones" || p.subcat === "vestidos").length;
      } else if (sc === "sneakers") {
        n = APPAREL_LIST.filter((p) => p.subcat === "sneakers" || p.subcat === "gorras").length;
      } else if (sc !== "all") {
        n = APPAREL_LIST.filter((p) => p.subcat === sc).length;
      }
      el.textContent = `${n} ${n === 1 ? "prenda" : "prendas"}`;
    });
  }

  // ---------- Barra Horizontal de Marcas o Tallas ----------
  function renderHorizontalRail() {
    const rail = $("#brandChips");
    if (!rail) return;

    if (state.dept === "perfumes") {
      const counts = {};
      PERFUMES_LIST.forEach((p) => {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      });
      const brands = Object.keys(counts).sort((a, b) => a.localeCompare(b));

      rail.innerHTML =
        `<button type="button" class="brand-chip ${state.brand === "all" ? "is-active" : ""}" data-b="all">
          <span>Todas las Marcas</span>
          <span class="brand-chip__count">(${PERFUMES_LIST.length})</span>
        </button>` +
        brands
          .map(
            (b) => `
          <button type="button" class="brand-chip ${state.brand === b ? "is-active" : ""}" data-b="${b}">
            <span>${b}</span>
            <span class="brand-chip__count">(${counts[b]})</span>
          </button>`
          )
          .join("");
    } else {
      const sizeSet = new Set();
      APPAREL_LIST.forEach((p) => (p.sizes || []).forEach((s) => sizeSet.add(s)));
      const allSizes = Array.from(sizeSet);

      rail.innerHTML =
        `<button type="button" class="brand-chip ${state.brand === "all" ? "is-active" : ""}" data-b="all">
          <span>Todas las Tallas</span>
        </button>` +
        allSizes
          .map(
            (sz) => `
          <button type="button" class="brand-chip ${state.brand === sz ? "is-active" : ""}" data-b="${sz}">
            <span>Talla ${sz}</span>
          </button>`
          )
          .join("");
    }
  }

  // ---------- Cambiar Departamento ----------
  function switchDepartment(dept, shouldScroll = false) {
    if (dept !== "perfumes" && dept !== "apparel") return;
    state.dept = dept;
    state.cat = "all";
    state.brand = "all";
    state.tier = "all";
    state.g = "all";

    $$("[data-dept]").forEach((btn) =>
      btn.classList.toggle("is-active", btn.dataset.dept === dept)
    );
    $$("[data-mob-nav]").forEach((btn) => {
      if (btn.dataset.mobNav === "perfumes" || btn.dataset.mobNav === "apparel") {
        btn.classList.toggle("is-active", btn.dataset.mobNav === dept);
      }
    });

    const isPerf = dept === "perfumes";
    $("#perfumeCompass").hidden = !isPerf;
    $("#apparelCompass").hidden = isPerf;

    const switchBtn = $("#heroSwitchDeptBtn");
    if (isPerf) {
      $("#search").placeholder =
        "Buscar perfume, marca o aroma (ej. Dior, Vainilla, Creed, Libre)…";
      $("#tierGroupLabel").textContent = "Gama:";
      $("#tierChips").innerHTML = `
        <button type="button" class="filter-pill is-active" data-tier="all">Todas</button>
        <button type="button" class="filter-pill" data-tier="niche">Perfumes Nicho</button>
        <button type="button" class="filter-pill" data-tier="designer">Diseñador</button>`;
      if (switchBtn) {
        switchBtn.dataset.deptTrigger = "apparel";
        switchBtn.innerHTML = "Ver Ropa &amp; Calzado &rarr;";
      }
    } else {
      $("#search").placeholder =
        "Buscar prenda, estilo, color o talla (ej. Camisa, Hoodie, Blazer, Tenis)…";
      $("#tierGroupLabel").textContent = "Estilo:";
      $("#tierChips").innerHTML = `
        <button type="button" class="filter-pill is-active" data-tier="all">Todos</button>
        <button type="button" class="filter-pill" data-tier="formal">Formal y Casual</button>
        <button type="button" class="filter-pill" data-tier="streetwear">Streetwear Urbano</button>`;
      if (switchBtn) {
        switchBtn.dataset.deptTrigger = "perfumes";
        switchBtn.innerHTML = "Ver Catálogo de Perfumes &rarr;";
      }
    }

    $$("#genderChips .filter-pill").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.g === "all")
    );
    $$("#familyGrid .cat-card").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.cat === "all")
    );
    $$("#apparelCatGrid .cat-card").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.subcat === "all")
    );

    renderHeroShowcase();
    renderHorizontalRail();
    renderCatalog();

    if (shouldScroll) {
      $("#familias").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- Filtrado y Ordenamiento ----------
  let currentFilteredList = [];

  function getFilteredItems() {
    const source = state.dept === "perfumes" ? PERFUMES_LIST : APPAREL_LIST;
    const q = norm(state.q.trim());
    const terms = q ? q.split(/\s+/) : [];

    const filtered = source.filter((item) => {
      if (state.g !== "all" && item.g !== state.g) return false;

      if (state.dept === "perfumes") {
        if (state.tier !== "all" && item.tier !== state.tier) return false;
        if (state.cat !== "all" && item.cat !== state.cat) return false;
        if (state.brand !== "all" && item.brand !== state.brand) return false;
      } else {
        if (state.tier !== "all" && item.line !== state.tier) return false;
        if (state.cat !== "all") {
          if (state.cat === "playeras") {
            if (item.subcat !== "playeras" && item.subcat !== "hoodies") return false;
          } else if (state.cat === "pantalones") {
            if (item.subcat !== "pantalones" && item.subcat !== "vestidos") return false;
          } else if (state.cat === "sneakers") {
            if (item.subcat !== "sneakers" && item.subcat !== "gorras") return false;
          } else if (item.subcat !== state.cat) {
            return false;
          }
        }
        if (state.brand !== "all" && !(item.sizes || []).includes(state.brand)) {
          return false;
        }
      }

      if (terms.length > 0 && !terms.every((t) => item.search.includes(t))) {
        return false;
      }
      return true;
    });

    if (state.sort === "bestsellers") {
      return [...filtered].sort((a, b) => {
        const ab = a.badge === "bestseller" ? 0 : a.badge === "new" ? 1 : 2;
        const bb = b.badge === "bestseller" ? 0 : b.badge === "new" ? 1 : 2;
        return ab - bb;
      });
    }
    if (state.sort === "name") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (state.sort === "brand") {
      return [...filtered].sort(
        (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)
      );
    }
    if (state.sort === "price_asc") {
      return [...filtered].sort(
        (a, b) => (a.price || 999999) - (b.price || 999999)
      );
    }
    if (state.sort === "price_desc") {
      return [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return filtered;
  }

  // ---------- Renderizado de Tarjeta Comercial ----------
  function renderCard(item) {
    const selected = isInTray(item.uid);
    const isOut = item.status === "out_of_stock";
    const badgeInfo = BADGE_MAP[item.badge];

    const priceStr = fmtMoney(item.price);
    const oldPriceStr = fmtMoney(item.oldPrice);

    let priceHtml = `<span class="price-quote">Precio por WhatsApp</span>`;
    if (priceStr) {
      priceHtml = `<span class="price-tag">${priceStr}${
        oldPriceStr ? `<span class="price-tag__old">${oldPriceStr}</span>` : ""
      }</span>`;
    }

    const stockHtml = isOut
      ? `<span class="stock-pill stock-pill--out">Agotado</span>`
      : `<span class="stock-pill">Disponible</span>`;

    let apparelExtra = "";
    if (item.dept === "apparel") {
      const swatches = (item.colors || [])
        .map(
          (c) =>
            `<span class="mini-swatch" style="background:${c.hex}" title="${c.name}"></span>`
        )
        .join("");
      const sizesText = (item.sizes || []).slice(0, 4).join(", ");
      apparelExtra = `
        <div class="card__apparel-bar">
          <div class="card__swatches">${swatches}</div>
          <span class="card__sizes-preview">Tallas: ${sizesText}</span>
        </div>`;
    }

    const presLabel =
      item.dept === "perfumes"
        ? `${item.conc || "EDP"}${item.sizeMl ? " · " + item.sizeMl : ""}`
        : item.fit || "Corte Regular";

    return `
      <article class="card ${isOut ? "is-out" : ""}" data-uid="${item.uid}">
        <div class="card__stage" data-open-uid="${item.uid}">
          <div class="card__top-bar">
            <div class="card__badges">
              ${
                isOut
                  ? `<span class="badge badge--out">Agotado</span>`
                  : badgeInfo
                  ? `<span class="badge ${badgeInfo.cls}">${badgeInfo.text}</span>`
                  : ""
              }
              <span class="badge">${GENDER_LABEL[item.g] || "Unisex"}</span>
            </div>
          </div>
          ${renderMedia(item)}
        </div>

        <div class="card__body">
          <div class="card__meta-row">
            <span class="card__brand">${item.brand}</span>
            <span class="card__conc">${presLabel}</span>
          </div>

          <h3 class="card__name" data-open-uid="${item.uid}">${item.name}</h3>

          <div class="card__price-row">
            ${priceHtml}
            ${stockHtml}
          </div>

          <p class="card__desc">${item.description || ""}</p>
          <p class="card__notes" title="${item.notes}">
            <strong>${item.dept === "perfumes" ? "Notas:" : "Tela:"}</strong> ${item.notes}
          </p>

          ${apparelExtra}

          <div class="card__actions">
            ${
              item.dept === "apparel"
                ? `<button type="button" class="card__btn-bag ${selected ? "is-selected" : ""}" data-open-uid="${item.uid}">
                    <span>${selected ? "✓ En tu Bolsa (Ver Talla)" : "Elegir Talla y Color"}</span>
                  </button>`
                : `<button
                    type="button"
                    class="card__btn-bag ${selected ? "is-selected" : ""}"
                    data-toggle-tray="${item.uid}"
                    ${isOut ? "disabled" : ""}
                  >
                    <span>${
                      isOut
                        ? "Agotado"
                        : selected
                        ? "✓ En Mi Bolsa"
                        : "+ Agregar a la Bolsa"
                    }</span>
                  </button>`
            }
            <a
              class="card__btn-wa-icon"
              href="${waLink(singleItemMessage(item))}"
              target="_blank"
              rel="noopener"
              data-wa-direct
              title="Pedir directo por WhatsApp"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>
              <span>Pedir</span>
            </a>
          </div>
        </div>
      </article>`;
  }

  // ---------- Renderizado del Catálogo ----------
  function renderCatalog() {
    currentFilteredList = getFilteredItems();
    const main = $("#catalogMain");
    const totalDept =
      state.dept === "perfumes" ? PERFUMES_LIST.length : APPAREL_LIST.length;
    const noun = state.dept === "perfumes" ? "perfumes" : "prendas";

    $("#count").textContent = `Mostrando ${currentFilteredList.length} de ${totalDept} ${noun}`;
    $("#empty").hidden = currentFilteredList.length > 0;

    renderActiveFilterTags();

    if (currentFilteredList.length === 0) {
      main.innerHTML = "";
      return;
    }

    if (state.view === "maison") {
      const groups = {};
      currentFilteredList.forEach((item) => {
        if (!groups[item.brand]) groups[item.brand] = [];
        groups[item.brand].push(item);
      });
      const brandNames = Object.keys(groups).sort((a, b) => a.localeCompare(b));
      main.innerHTML = `<div class="maison-sections">${brandNames
        .map(
          (b) => `
          <section class="maison-group">
            <div class="maison-group__head">
              <h3 class="maison-group__title">${b}</h3>
              <span class="maison-group__meta">${groups[b].length} ${
            groups[b].length === 1 ? "producto disponible" : "productos disponibles"
          }</span>
            </div>
            <div class="grid">
              ${groups[b].map(renderCard).join("")}
            </div>
          </section>`
        )
        .join("")}</div>`;
    } else {
      main.innerHTML = `<div class="grid" id="grid">${currentFilteredList
        .map(renderCard)
        .join("")}</div>`;
    }
  }

  function renderActiveFilterTags() {
    const tags = [];
    if (state.q.trim()) {
      tags.push({ key: "q", label: `Búsqueda: "${state.q.trim()}"` });
    }
    if (state.g !== "all") {
      tags.push({ key: "g", label: `Para: ${GENDER_LABEL[state.g]}` });
    }
    if (state.tier !== "all") {
      const tierMap = {
        niche: "Perfumes Nicho",
        designer: "Marcas de Diseñador",
        formal: "Formal y Casual",
        streetwear: "Streetwear Urbano"
      };
      tags.push({ key: "tier", label: tierMap[state.tier] || state.tier });
    }
    if (state.cat !== "all") {
      const catMap = {
        amber: "Ámbar e Intensos",
        woody: "Maderas y Cuero",
        floral: "Florales y Frutales",
        fresh: "Frescos y Cítricos",
        gourmand: "Dulces y Vainilla",
        camisas: "Camisas y Lino",
        sacos: "Sacos y Blazers",
        playeras: "Playeras y Hoodies",
        pantalones: "Pantalones y Vestidos",
        sneakers: "Tenis y Gorras"
      };
      tags.push({ key: "cat", label: catMap[state.cat] || state.cat });
    }
    if (state.brand !== "all") {
      tags.push({
        key: "brand",
        label: state.dept === "perfumes" ? `Marca: ${state.brand}` : `Talla ${state.brand}`
      });
    }

    $("#activeFilters").innerHTML = tags
      .map(
        (t) =>
          `<button type="button" class="active-tag" data-clear-filter="${t.key}">
            <span>${t.label}</span>
            <span aria-hidden="true">&times;</span>
          </button>`
      )
      .join("");

    $("#resetFiltersBtn").hidden = tags.length === 0;
  }

  function resetAllFilters() {
    state.q = "";
    state.g = "all";
    state.tier = "all";
    state.cat = "all";
    state.brand = "all";
    $("#search").value = "";
    $("#clearSearch").hidden = true;

    $$("#genderChips .filter-pill").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.g === "all")
    );
    $$("#tierChips .filter-pill").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.tier === "all")
    );
    $$("#familyGrid .cat-card").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.cat === "all")
    );
    $$("#apparelCatGrid .cat-card").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.subcat === "all")
    );
    renderHorizontalRail();
    renderCatalog();
  }

  // ---------- Modal Detalle del Producto ----------
  const modal = $("#modal");
  let currentModalItem = null;
  let modalSelectedSize = "";
  let modalSelectedColor = "";
  let modalSelectedColorHex = "";
  let lastFocusedEl = null;

  function openModalByUid(uid) {
    const item = ITEM_MAP[uid];
    if (!item) return;
    currentModalItem = item;
    if (!lastFocusedEl) lastFocusedEl = document.activeElement;

    const existingEntry = tray.find((e) => e.uid === item.uid);
    modalSelectedSize = existingEntry?.size || item.defaultSize || "";
    modalSelectedColor = existingEntry?.color || item.defaultColor || "";
    const colorObj =
      (item.colors || []).find((c) => c.name === modalSelectedColor) ||
      (item.colors && item.colors[0]);
    modalSelectedColorHex = colorObj ? colorObj.hex : "#ebe5d9";

    populateModal(item);

    modal.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => modal.classList.add("is-open"));
  }

  function populateModal(item) {
    const isPerf = item.dept === "perfumes";
    const isOut = item.status === "out_of_stock";

    $("#mTier").textContent = isPerf
      ? item.tier === "niche"
        ? "Perfumería Nicho"
        : "Marca de Diseñador"
      : item.line === "formal"
      ? "Línea Formal / Casual"
      : "Streetwear Urbano";

    $("#mTag").textContent = `Para ${GENDER_LABEL[item.g] || "Unisex"}`;

    const stBadge = $("#mStatusBadge");
    stBadge.textContent = isOut ? "Agotado" : "✓ Disponible";
    stBadge.className = `modal__status-badge ${isOut ? "is-out" : "is-ok"}`;

    $("#mMedia").innerHTML = renderMedia(item, modalSelectedColorHex);
    $("#mBrand").textContent = item.brand;
    $("#mConc").textContent = isPerf
      ? `${item.conc || "Eau de Parfum"} · ${item.sizeMl || "100 ml"}`
      : item.fit || "";
    $("#mTitle").textContent = item.name;
    $("#mFamily").textContent = item.family || "";

    // Precio en Modal
    const priceStr = fmtMoney(item.price);
    const oldPriceStr = fmtMoney(item.oldPrice);
    if (priceStr) {
      $("#mPriceBox").innerHTML = `${priceStr} ${
        oldPriceStr ? `<span class="price-tag__old">${oldPriceStr}</span>` : ""
      }`;
    } else {
      $("#mPriceBox").innerHTML = `<span class="price-quote">Cotización directa por WhatsApp</span>`;
    }

    // Descripción comercial clara
    $("#mDescription").textContent =
      item.description || LuxoraDB.buildCommercialDescription(item);

    const list = currentFilteredList.length ? currentFilteredList : PERFUMES_LIST;
    const idx = list.findIndex((x) => x.uid === item.uid);
    $("#mIndex").textContent =
      idx >= 0 ? `${idx + 1} de ${list.length}` : `1 de ${list.length}`;

    // Selectores de Talla y Color para Ropa
    const appSel = $("#mApparelSelectors");
    if (!isPerf) {
      appSel.hidden = false;
      $("#mSelectedColorName").textContent = modalSelectedColor;
      $("#mFitLabel").textContent = item.fit || "";

      $("#mColorSwatches").innerHTML = (item.colors || [])
        .map(
          (c) => `
          <button
            type="button"
            class="swatch-btn ${c.name === modalSelectedColor ? "is-active" : ""}"
            data-pick-color="${c.name}"
            data-pick-hex="${c.hex}"
          >
            <span class="swatch-btn__dot" style="background:${c.hex}"></span>
            <span>${c.name}</span>
          </button>`
        )
        .join("");

      $("#mSizePills").innerHTML = (item.sizes || [])
        .map(
          (sz) => `
          <button
            type="button"
            class="size-btn ${sz === modalSelectedSize ? "is-active" : ""}"
            data-pick-size="${sz}"
          >
            ${sz}
          </button>`
        )
        .join("");
    } else {
      appSel.hidden = true;
    }

    $("#mNotesHeading").textContent = isPerf
      ? "Notas que componen su aroma:"
      : "Materiales y detalles de la prenda:";
    $("#mNotes").innerHTML = (item.notes || "")
      .split(",")
      .filter(Boolean)
      .map((n) => `<li>${n.trim()}</li>`)
      .join("");

    if (isPerf) {
      const prof = CAT_PROFILE[item.cat] || CAT_PROFILE.amber;
      $("#mProfile").innerHTML = `
        <div class="profile-cell">
          <span class="profile-cell__label">Duración / Fijación</span>
          <span class="profile-cell__val">${prof.sillage}</span>
        </div>
        <div class="profile-cell">
          <span class="profile-cell__label">Estilo</span>
          <span class="profile-cell__val">${prof.mood}</span>
        </div>
        <div class="profile-cell">
          <span class="profile-cell__label">Recomendado para</span>
          <span class="profile-cell__val">${prof.season}</span>
        </div>`;
    } else {
      $("#mProfile").innerHTML = `
        <div class="profile-cell">
          <span class="profile-cell__label">Corte</span>
          <span class="profile-cell__val">${item.fit || "Regular"}</span>
        </div>
        <div class="profile-cell">
          <span class="profile-cell__label">Talla Seleccionada</span>
          <span class="profile-cell__val" id="mProfileSize">${modalSelectedSize}</span>
        </div>
        <div class="profile-cell">
          <span class="profile-cell__label">Color</span>
          <span class="profile-cell__val" id="mProfileColor">${modalSelectedColor}</span>
        </div>`;
    }

    updateModalActionButtons();

    const source = isPerf ? PERFUMES_LIST : APPAREL_LIST;
    const related = source
      .filter(
        (x) =>
          x.uid !== item.uid &&
          (x.brand === item.brand || x.cat === item.cat || x.line === item.line)
      )
      .slice(0, 3);

    $("#mRelated").innerHTML = related
      .map(
        (r) => `
        <button type="button" class="related-card" data-open-uid="${r.uid}">
          ${r.img ? `<img src="${r.img}" alt="${r.name}" loading="lazy" />` : ""}
          <div>
            <p class="related-card__brand">${r.brand}</p>
            <p class="related-card__name">${r.name}</p>
          </div>
        </button>`
      )
      .join("");
  }

  function updateModalActionButtons() {
    if (!currentModalItem) return;
    const item = currentModalItem;
    const isPerf = item.dept === "perfumes";
    const isOut = item.status === "out_of_stock";
    const opts = { size: modalSelectedSize, color: modalSelectedColor };

    $("#mWa").href = waLink(singleItemMessage(item, opts));
    $("#mWaText").textContent = isPerf
      ? "Pedir Ahora por WhatsApp"
      : `Pedir Talla ${modalSelectedSize} por WhatsApp`;

    const inTray = isInTray(item.uid);
    const trayBtn = $("#mTrayBtn");
    trayBtn.disabled = isOut;
    $("#mTrayBtnText").textContent = isOut
      ? "Producto Agotado"
      : inTray
      ? "✓ Ya está en tu Bolsa (Quitar)"
      : isPerf
      ? "+ Agregar a Mi Bolsa"
      : `+ Agregar Talla ${modalSelectedSize} a Mi Bolsa`;
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => {
      modal.hidden = true;
      currentModalItem = null;
    }, 220);
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
    lastFocusedEl = null;
  }

  function stepModal(dir) {
    if (!currentModalItem) return;
    const list = currentFilteredList.length
      ? currentFilteredList
      : state.dept === "perfumes"
      ? PERFUMES_LIST
      : APPAREL_LIST;
    if (!list.length) return;
    const idx = list.findIndex((x) => x.uid === currentModalItem.uid);
    const nextIdx = (idx + dir + list.length) % list.length;
    openModalByUid(list[nextIdx].uid);
  }

  // ---------- UI de "Mi Bolsa de Pedido" ----------
  const trayDrawer = $("#trayDrawer");

  function openTrayDrawer() {
    trayDrawer.hidden = false;
    document.body.classList.add("no-scroll");
  }

  function closeTrayDrawer() {
    trayDrawer.hidden = true;
    if (modal.hidden) {
      document.body.classList.remove("no-scroll");
    }
  }

  function updateTrayUI() {
    tray = tray.filter((entry) => entry && ITEM_MAP[entry.uid]);
    const count = tray.length;

    $("#trayCount").textContent = count;
    const mobBadge = $("#mobBagCount");
    if (mobBadge) {
      mobBadge.textContent = count;
      mobBadge.hidden = count === 0;
    }

    let subtotal = 0;
    let pricedCount = 0;
    tray.forEach((entry) => {
      const it = ITEM_MAP[entry.uid];
      if (it && it.price && it.price > 0) {
        subtotal += it.price;
        pricedCount++;
      }
    });

    const bar = $("#selectionBar");
    bar.hidden = count === 0;
    $("#barCount").textContent = count;
    $("#barTitle").textContent =
      count === 1 ? "1 producto en tu Bolsa" : `${count} productos en tu Bolsa`;
    $("#barSubtotal").textContent =
      pricedCount > 0
        ? `Subtotal: ${fmtMoney(subtotal)}${
            pricedCount < count ? " + productos por cotizar" : ""
          }`
        : "Listos para cotizar por WhatsApp";

    $("#barThumbs").innerHTML = tray
      .slice(0, 5)
      .map((entry) => {
        const item = ITEM_MAP[entry.uid];
        if (!item || !item.img) return "";
        return `<img class="bar-thumb" src="${item.img}" alt="${item.name}" />`;
      })
      .join("");

    const summaryEl = $("#traySummary");
    if (pricedCount > 0) {
      summaryEl.hidden = false;
      $("#traySubtotalVal").textContent = fmtMoney(subtotal);
    } else {
      summaryEl.hidden = true;
    }

    const consolidatedHref = waLink(multiTrayMessage());
    $("#barWaBtn").href = consolidatedHref;
    $("#trayWaBtn").href = consolidatedHref;
    $("#trayWaText").textContent =
      count > 0
        ? `Enviar Pedido (${count}) por WhatsApp`
        : "Consultar por WhatsApp";

    const listEl = $("#trayList");
    const footerEl = $("#trayFooter");
    if (count === 0) {
      footerEl.hidden = true;
      listEl.innerHTML = `
        <div class="tray-empty">
          <h3 class="tray-empty__title">Tu bolsa está vacía</h3>
          <p>Toca el botón <strong>+ Agregar a la Bolsa</strong> en cualquier perfume o prenda para armar tu pedido y enviarlo por WhatsApp.</p>
        </div>`;
      return;
    }

    footerEl.hidden = false;
    listEl.innerHTML = tray
      .map((entry) => {
        const item = ITEM_MAP[entry.uid];
        if (!item) return "";
        const subMeta =
          item.dept === "apparel"
            ? `Talla: <strong>${entry.size}</strong> &middot; Color: ${entry.color}`
            : `${item.conc || "Eau de Parfum"} &middot; ${item.sizeMl || "100 ml"}`;
        const pStr = fmtMoney(item.price) || "Precio por cotizar";

        return `
          <div class="tray-item">
            <div class="tray-item__thumb">
              ${item.img ? `<img src="${item.img}" alt="${item.name}" />` : renderMedia(item)}
            </div>
            <div>
              <p class="tray-item__brand">${item.brand}</p>
              <h4 class="tray-item__name">${item.name}</h4>
              <p class="tray-item__meta">${subMeta}</p>
              <p class="tray-item__price">${pStr}</p>
            </div>
            <button
              type="button"
              class="tray-item__remove"
              data-remove-tray="${item.uid}"
              title="Quitar de la bolsa"
            >&times;</button>
          </div>`;
      })
      .join("");
  }

  // ---------- Eventos de Interacción ----------
  document.addEventListener("click", (e) => {
    const deptBtn = e.target.closest("[data-dept]");
    if (deptBtn) {
      switchDepartment(deptBtn.dataset.dept, false);
      return;
    }
    const deptTrig = e.target.closest("[data-dept-trigger]");
    if (deptTrig) {
      switchDepartment(deptTrig.dataset.deptTrigger, true);
      return;
    }

    // Navegación Inferior Móvil (App Shell)
    const mobNav = e.target.closest("[data-mob-nav]");
    if (mobNav) {
      const action = mobNav.dataset.mobNav;
      if (action === "perfumes" || action === "apparel") {
        switchDepartment(action, true);
      } else if (action === "search") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => $("#search").focus(), 250);
      } else if (action === "bag") {
        openTrayDrawer();
      }
      return;
    }

    const trayToggle = e.target.closest("[data-toggle-tray]");
    if (trayToggle) {
      e.stopPropagation();
      const item = ITEM_MAP[trayToggle.dataset.toggleTray];
      if (item) toggleTrayItem(item);
      return;
    }

    const removeBtn = e.target.closest("[data-remove-tray]");
    if (removeBtn) {
      const item = ITEM_MAP[removeBtn.dataset.removeTray];
      if (item) toggleTrayItem(item);
      if (currentModalItem) updateModalActionButtons();
      return;
    }

    const openEl = e.target.closest("[data-open-uid]");
    if (openEl && !e.target.closest("[data-wa-direct]")) {
      openModalByUid(openEl.dataset.openUid);
      return;
    }

    const colorBtn = e.target.closest("[data-pick-color]");
    if (colorBtn && currentModalItem) {
      modalSelectedColor = colorBtn.dataset.pickColor;
      modalSelectedColorHex = colorBtn.dataset.pickHex;
      $$("#mColorSwatches .swatch-btn").forEach((b) =>
        b.classList.toggle("is-active", b === colorBtn)
      );
      $("#mSelectedColorName").textContent = modalSelectedColor;
      const profColor = $("#mProfileColor");
      if (profColor) profColor.textContent = modalSelectedColor;
      $("#mMedia").innerHTML = renderMedia(currentModalItem, modalSelectedColorHex);
      updateModalActionButtons();
      return;
    }

    const sizeBtn = e.target.closest("[data-pick-size]");
    if (sizeBtn && currentModalItem) {
      modalSelectedSize = sizeBtn.dataset.pickSize;
      $$("#mSizePills .size-btn").forEach((b) =>
        b.classList.toggle("is-active", b === sizeBtn)
      );
      const profSize = $("#mProfileSize");
      if (profSize) profSize.textContent = modalSelectedSize;
      updateModalActionButtons();
      return;
    }

    const clearFilterBtn = e.target.closest("[data-clear-filter]");
    if (clearFilterBtn) {
      const k = clearFilterBtn.dataset.clearFilter;
      if (k === "q") {
        state.q = "";
        $("#search").value = "";
        $("#clearSearch").hidden = true;
      } else if (k === "g") {
        state.g = "all";
        $$("#genderChips .filter-pill").forEach((b) =>
          b.classList.toggle("is-active", b.dataset.g === "all")
        );
      } else if (k === "tier") {
        state.tier = "all";
        $$("#tierChips .filter-pill").forEach((b) =>
          b.classList.toggle("is-active", b.dataset.tier === "all")
        );
      } else if (k === "cat") {
        state.cat = "all";
        $$("#familyGrid .cat-card").forEach((b) =>
          b.classList.toggle("is-active", b.dataset.cat === "all")
        );
        $$("#apparelCatGrid .cat-card").forEach((b) =>
          b.classList.toggle("is-active", b.dataset.subcat === "all")
        );
      } else if (k === "brand") {
        state.brand = "all";
        renderHorizontalRail();
      }
      renderCatalog();
      return;
    }

    const quickBrand = e.target.closest("[data-quick-brand]");
    if (quickBrand) {
      if (state.dept !== "perfumes") switchDepartment("perfumes", false);
      state.brand = quickBrand.dataset.quickBrand;
      renderHorizontalRail();
      renderCatalog();
      $("#catalogo").scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (e.target.closest("[data-close]")) {
      closeModal();
      return;
    }
    if (e.target.closest("[data-close-tray]")) {
      closeTrayDrawer();
      return;
    }
  });

  $("#familyGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".cat-card");
    if (!card) return;
    $$("#familyGrid .cat-card").forEach((c) =>
      c.classList.toggle("is-active", c === card)
    );
    state.cat = card.dataset.cat;
    renderCatalog();
  });

  $("#apparelCatGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".cat-card");
    if (!card) return;
    $$("#apparelCatGrid .cat-card").forEach((c) =>
      c.classList.toggle("is-active", c === card)
    );
    state.cat = card.dataset.subcat;
    renderCatalog();
  });

  $("#genderChips").addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    $$("#genderChips .filter-pill").forEach((c) =>
      c.classList.toggle("is-active", c === pill)
    );
    state.g = pill.dataset.g;
    renderCatalog();
  });

  $("#tierChips").addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    $$("#tierChips .filter-pill").forEach((c) =>
      c.classList.toggle("is-active", c === pill)
    );
    state.tier = pill.dataset.tier;
    renderCatalog();
  });

  $("#brandChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".brand-chip");
    if (!chip) return;
    $$("#brandChips .brand-chip").forEach((c) =>
      c.classList.toggle("is-active", c === chip)
    );
    state.brand = chip.dataset.b;
    chip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    renderCatalog();
  });

  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderCatalog();
  });

  $$(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".view-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      state.view = btn.dataset.view;
      renderCatalog();
    });
  });

  let searchTimer;
  const searchInput = $("#search");
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    $("#clearSearch").hidden = !val;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = val;
      renderCatalog();
    }, 90);
  });

  $("#clearSearch").addEventListener("click", () => {
    searchInput.value = "";
    state.q = "";
    $("#clearSearch").hidden = true;
    searchInput.focus();
    renderCatalog();
  });

  $("#resetFiltersBtn").addEventListener("click", resetAllFilters);
  $("#emptyResetBtn").addEventListener("click", resetAllFilters);

  $("#mPrev").addEventListener("click", () => stepModal(-1));
  $("#mNext").addEventListener("click", () => stepModal(1));

  $("#mTrayBtn").addEventListener("click", () => {
    if (!currentModalItem) return;
    toggleTrayItem(currentModalItem, {
      size: modalSelectedSize,
      color: modalSelectedColor
    });
    updateModalActionButtons();
  });

  $("#mBrand").addEventListener("click", () => {
    if (!currentModalItem) return;
    if (currentModalItem.dept === "perfumes") {
      state.brand = currentModalItem.brand;
      renderHorizontalRail();
      renderCatalog();
    }
    closeModal();
    $("#catalogo").scrollIntoView({ behavior: "smooth" });
  });

  $("#openTrayBtn").addEventListener("click", openTrayDrawer);
  $("#barOpenDrawerBtn").addEventListener("click", openTrayDrawer);
  $("#selectionBarInfo").addEventListener("click", openTrayDrawer);

  $("#clearTrayBtn").addEventListener("click", () => {
    tray = [];
    saveTray();
    renderCatalog();
  });

  $("#prefChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".pref-chip");
    if (!chip) return;
    const pref = chip.dataset.pref;
    if (activePrefs.has(pref)) {
      activePrefs.delete(pref);
      chip.classList.remove("is-active");
    } else {
      activePrefs.add(pref);
      chip.classList.add("is-active");
    }
    updateTrayUI();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput && modal.hidden) {
      e.preventDefault();
      searchInput.focus();
      return;
    }
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (!trayDrawer.hidden) closeTrayDrawer();
      return;
    }
    if (!modal.hidden) {
      if (e.key === "ArrowLeft") stepModal(-1);
      if (e.key === "ArrowRight") stepModal(1);
    }
  });

  // ---------- Registro de PWA (Service Worker + Botón Instalar App) ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  let deferredInstallPrompt = null;
  const installBtn = $("#installPwaBtn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.hidden = true;
    });
  }

  // ---------- Inicialización y Conexión a Base de Datos ----------
  const header = $("#header");
  window.addEventListener(
    "scroll",
    () => header.classList.toggle("is-scrolled", window.scrollY > 10),
    { passive: true }
  );

  function refreshAllViews() {
    reloadCatalogFromDB();
    loadTray();
    const consultHref = waLink(
      CONFIG.consultMessage ||
        "Hola, necesito ayuda para elegir un perfume o prenda en LUXORA."
    );
    $("#headerWa").href = consultHref;
    $("#conciergeWaBtn").href = consultHref;
    $("#emptyWaBtn").href = consultHref;
    $("#footerCity").textContent =
      CONFIG.city || "Envíos seguros a todo el país · Atención personalizada";
    $("#year").textContent = new Date().getFullYear();

    updateCompassCounts();
    renderHeroShowcase();
    renderHorizontalRail();
    renderFooterBrands();
    updateTrayUI();
    renderCatalog();
  }

  // Reaccionar en tiempo real cuando el Administrador agrega/edita productos
  LuxoraDB.onChange(() => {
    refreshAllViews();
  });

  refreshAllViews();
  LuxoraDB.init().then(() => {
    refreshAllViews();
  });
})();
