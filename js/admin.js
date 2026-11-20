(() => {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  const CAT_LABELS = {
    gourmand: "Dulces y Vainilla",
    fresh: "Frescos y Cítricos",
    woody: "Maderas y Cuero",
    floral: "Florales y Frutales",
    amber: "Ámbar e Intensos"
  };

  const SUBCAT_LABELS = {
    camisas: "Camisas y Lino",
    sacos: "Sacos y Blazers",
    playeras: "Playeras",
    hoodies: "Hoodies y Sudaderas",
    pantalones: "Pantalones",
    vestidos: "Vestidos",
    sneakers: "Tenis / Calzado",
    gorras: "Gorras y Accesorios"
  };

  const COLOR_HEX_GUESS = {
    negro: "#1a1a1a",
    blanco: "#f7f6f2",
    arena: "#d2c5b0",
    marfil: "#f3efe6",
    crema: "#ebe5d9",
    gris: "#808080",
    azul: "#1e2c42",
    marino: "#182232",
    verde: "#4e5b47",
    olivo: "#556046",
    rojo: "#8c1d24",
    borgona: "#541e24",
    vino: "#541e24",
    cafe: "#4a382e",
    beige: "#d8ccb8",
    celeste: "#cfdbe6"
  };

  function guessHex(colorName = "") {
    const clean = colorName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    for (const [k, hex] of Object.entries(COLOR_HEX_GUESS)) {
      if (clean.includes(k)) return hex;
    }
    return "#cfc7ba";
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
    }, 2800);
  }

  const norm = (s = "") =>
    String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  let allProducts = [];

  function updateConnectionBadge() {
    const pill = $("#openFirebaseModalBtn");
    const txt = $("#dbStatusText");
    if (LuxoraDB.isFirebaseConnected()) {
      const cfg = LuxoraDB.getActiveFirebaseConfig();
      pill.classList.add("is-cloud");
      txt.textContent = `Firebase Cloud (${cfg ? cfg.projectId : "Activo"})`;
    } else {
      pill.classList.remove("is-cloud");
      txt.textContent = "Base Local Activa (Conectar Firebase)";
    }
  }

  function updateStats() {
    allProducts = LuxoraDB.getAllProducts({ includeHidden: true });
    const perfs = allProducts.filter((x) => x.dept === "perfumes");
    const apps = allProducts.filter((x) => x.dept === "apparel");
    const priced = allProducts.filter((x) => x.price && x.price > 0);
    const out = allProducts.filter((x) => x.status === "out_of_stock");

    $("#statTotal").textContent = allProducts.length;
    $("#statPerfumes").textContent = perfs.length;
    $("#statApparel").textContent = apps.length;
    $("#statPriced").textContent = priced.length;
    $("#statOut").textContent = out.length;

    // Autocompletado de marcas
    const brands = [...new Set(allProducts.map((x) => x.brand))].sort();
    $("#brandSuggestions").innerHTML = brands
      .map((b) => `<option value="${b}"></option>`)
      .join("");
  }

  function renderTable() {
    updateStats();
    const q = norm($("#adminSearch").value.trim());
    const deptFilter = $("#adminDeptFilter").value;
    const statusFilter = $("#adminStatusFilter").value;

    const filtered = allProducts.filter((item) => {
      if (deptFilter !== "all" && item.dept !== deptFilter) return false;
      if (statusFilter === "available" && item.status !== "available") return false;
      if (statusFilter === "out_of_stock" && item.status !== "out_of_stock") return false;
      if (statusFilter === "priced" && (!item.price || item.price <= 0)) return false;
      if (statusFilter === "unpriced" && item.price && item.price > 0) return false;

      if (q) {
        const hay = norm(
          `${item.name} ${item.brand} ${item.notes || ""} ${item.description || ""} ${item.family || ""}`
        );
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    const tbody = $("#adminTableBody");
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:2.5rem;color:var(--muted)">
            No se encontraron productos con ese criterio.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((item) => {
        const id = item.id || item.uid;
        const isAvailable = item.status !== "out_of_stock" && item.status !== "hidden";
        const catText =
          item.dept === "perfumes"
            ? `Perfume · ${CAT_LABELS[item.cat] || item.family || "EDP"}`
            : `Ropa · ${SUBCAT_LABELS[item.subcat] || item.family || "Prenda"}`;

        const thumbHtml = item.img
          ? `<img class="prod-cell__thumb" src="${item.img}" alt="${item.name}" loading="lazy" />`
          : `<div class="prod-cell__thumb" style="display:grid;place-items:center;font-size:0.65rem;color:var(--muted)">${
              item.dept === "apparel" ? "ROPA" : "FOTO"
            }</div>`;

        const badgeLabels = {
          bestseller: "★ Más Vendido",
          new: "Nuevo",
          promo: "En Oferta"
        };

        return `
          <tr data-row-id="${id}">
            <td>
              <div class="prod-cell">
                ${thumbHtml}
                <div>
                  <div class="prod-cell__brand">${item.brand}</div>
                  <div class="prod-cell__name">${item.name}</div>
                  <div class="prod-cell__desc" title="${item.description || ""}">${
          item.description || item.notes || ""
        }</div>
                </div>
              </div>
            </td>
            <td>
              <span style="font-size:0.78rem;font-weight:600">${catText}</span>
              <div style="font-size:0.7rem;color:var(--muted)">${
                item.dept === "perfumes"
                  ? `${item.conc || "EDP"} · ${item.sizeMl || "100 ml"}`
                  : `Tallas: ${(item.sizes || []).join(", ")}`
              }</div>
            </td>
            <td>
              <input
                type="number"
                class="quick-price-input"
                data-quick-price="${id}"
                value="${item.price && item.price > 0 ? item.price : ""}"
                placeholder="Cotizar"
                min="0"
                title="Escribe un precio y presiona Enter o sal del campo para guardar"
              />
            </td>
            <td>
              <button
                type="button"
                class="status-toggle-btn ${isAvailable ? "is-available" : "is-out"}"
                data-toggle-status="${id}"
                title="Clic para cambiar entre Disponible y Agotado"
              >
                ${
                  item.status === "hidden"
                    ? "Oculto"
                    : isAvailable
                    ? "✓ Disponible"
                    : "✕ Agotado"
                }
              </button>
            </td>
            <td>
              <span style="font-size:0.75rem;font-weight:700;color:var(--accent-dark)">
                ${badgeLabels[item.badge] || "—"}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button type="button" class="action-btn" data-edit-id="${id}">Editar</button>
                <button type="button" class="action-btn action-btn--danger" data-delete-id="${id}">Eliminar</button>
              </div>
            </td>
          </tr>`;
      })
      .join("");
  }

  // ---------- Formulario de Crear / Editar Producto ----------
  const productModal = $("#productModal");
  let currentUploadedDataUrl = "";

  function toggleDeptFields(dept) {
    const isPerf = dept === "perfumes";
    $("#perfumeFieldsGroup").hidden = !isPerf;
    $("#apparelFieldsGroup").hidden = isPerf;
    $("#fNotesLabel").textContent = isPerf
      ? "Notas Principales del Perfume (separadas por coma) *"
      : "Materiales / Tela de la Prenda (separados por coma) *";
    $("#fNotes").placeholder = isPerf
      ? "Ej. Vainilla, Lavanda, Madera de Cedro, Bergamota"
      : "Ej. Algodón Peinado 100%, Lino Italiano, Piel Vacuna";
  }

  $("#fDept").addEventListener("change", (e) => {
    toggleDeptFields(e.target.value);
  });

  function updateImgPreview(src) {
    const box = $("#fImgPreview");
    if (src) {
      box.innerHTML = `<img src="${src}" alt="Vista previa" />`;
    } else {
      box.innerHTML = `<span style="font-size:0.7rem;color:var(--muted)">Sin foto</span>`;
    }
  }

  $("#fImgFile").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      showToast("Optimizando imagen...");
      const dataUrl = await LuxoraDB.compressImageFile(file, 640, 0.85);
      currentUploadedDataUrl = dataUrl;
      $("#fImgUrl").value = "";
      updateImgPreview(dataUrl);
      showToast("✓ Imagen lista para guardar");
    } catch (err) {
      showToast("Error al procesar la imagen");
    }
  });

  $("#fImgUrl").addEventListener("input", (e) => {
    currentUploadedDataUrl = "";
    updateImgPreview(e.target.value.trim());
  });

  // Generador automático de descripción comercial clara
  $("#genAutoDescBtn").addEventListener("click", () => {
    const dept = $("#fDept").value;
    const dummy = {
      dept,
      name: $("#fName").value.trim() || "este producto",
      brand: $("#fBrand").value.trim() || "Luxora",
      g: $("#fGender").value,
      cat: $("#fCat").value,
      conc: $("#fConc").value.trim() || "Eau de Parfum",
      line: $("#fLine").value,
      notes: $("#fNotes").value.trim() || "ingredientes selectos"
    };
    $("#fDescription").value = LuxoraDB.buildCommercialDescription(dummy);
    showToast("✓ Descripción comercial redactada");
  });

  function openProductModal(item = null) {
    $("#productForm").reset();
    currentUploadedDataUrl = "";

    if (item) {
      $("#prodModalTitle").textContent = `Editar: ${item.name}`;
      $("#fId").value = item.id || item.uid;
      $("#fDept").value = item.dept || "perfumes";
      $("#fStatus").value = item.status || "available";
      $("#fBadge").value = item.badge || "";
      $("#fName").value = item.name || "";
      $("#fBrand").value = item.brand || "";
      $("#fPrice").value = item.price && item.price > 0 ? item.price : "";
      $("#fOldPrice").value = item.oldPrice && item.oldPrice > 0 ? item.oldPrice : "";
      $("#fGender").value = item.g || "u";
      $("#fNotes").value = item.notes || "";
      $("#fDescription").value = item.description || "";

      if (item.dept === "apparel") {
        $("#fLine").value = item.line || "formal";
        $("#fSubcat").value = item.subcat || "camisas";
        $("#fFit").value = item.fit || "Regular Fit";
        $("#fSizes").value = (item.sizes || ["S", "M", "L", "XL"]).join(", ");
        $("#fColors").value = (item.colors || [])
          .map((c) => c.name)
          .join(", ");
      } else {
        $("#fCat").value = item.cat || "amber";
        $("#fTier").value = item.tier || "designer";
        $("#fConc").value = item.conc || "Eau de Parfum";
        $("#fSizeMl").value = item.sizeMl || "100 ml";
      }

      if (item.img && item.img.startsWith("data:")) {
        currentUploadedDataUrl = item.img;
        $("#fImgUrl").value = "";
      } else {
        $("#fImgUrl").value = item.img || "";
      }
      updateImgPreview(item.img || "");
      toggleDeptFields(item.dept || "perfumes");
    } else {
      $("#prodModalTitle").textContent = "Añadir Nuevo Producto";
      $("#fId").value = "";
      $("#fDept").value = "perfumes";
      $("#fConc").value = "Eau de Parfum";
      $("#fSizeMl").value = "100 ml";
      $("#fFit").value = "Regular Fit";
      $("#fSizes").value = "S, M, L, XL";
      $("#fColors").value = "Negro, Blanco, Arena";
      updateImgPreview("");
      toggleDeptFields("perfumes");
    }

    productModal.hidden = false;
  }

  function closeProductModal() {
    productModal.hidden = true;
  }

  $("#productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const dept = $("#fDept").value;
    const isPerf = dept === "perfumes";
    const imgVal = currentUploadedDataUrl || $("#fImgUrl").value.trim();

    const payload = {
      id: $("#fId").value || undefined,
      dept,
      status: $("#fStatus").value,
      badge: $("#fBadge").value,
      name: $("#fName").value.trim(),
      brand: $("#fBrand").value.trim(),
      price: $("#fPrice").value,
      oldPrice: $("#fOldPrice").value,
      g: $("#fGender").value,
      notes: $("#fNotes").value.trim(),
      description: $("#fDescription").value.trim(),
      img: imgVal
    };

    if (isPerf) {
      payload.cat = $("#fCat").value;
      payload.tier = $("#fTier").value;
      payload.conc = $("#fConc").value.trim() || "Eau de Parfum";
      payload.sizeMl = $("#fSizeMl").value.trim() || "100 ml";
      payload.family = CAT_LABELS[payload.cat] || "Aroma Exclusivo";
    } else {
      payload.line = $("#fLine").value;
      payload.subcat = $("#fSubcat").value;
      payload.fit = $("#fFit").value.trim() || "Regular Fit";
      payload.family = SUBCAT_LABELS[payload.subcat] || "Ropa & Moda";
      payload.sizes = $("#fSizes")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const colorNames = $("#fColors")
        .value.split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      payload.colors = colorNames.length
        ? colorNames.map((name) => ({ name, hex: guessHex(name) }))
        : [{ name: "Negro", hex: "#1a1a1a" }];
    }

    try {
      await LuxoraDB.saveProduct(payload);
      closeProductModal();
      renderTable();
      showToast(`✓ "${payload.name}" guardado correctamente`);
    } catch (err) {
      showToast("Error al guardar: " + err.message);
    }
  });

  // ---------- Eventos en la Tabla (Precio rápido, Disponible/Agotado, Editar, Eliminar) ----------
  $("#adminTableBody").addEventListener("change", async (e) => {
    const priceInput = e.target.closest("[data-quick-price]");
    if (priceInput) {
      const id = priceInput.dataset.quickPrice;
      const item = allProducts.find((x) => (x.id || x.uid) === id);
      if (!item) return;
      await LuxoraDB.saveProduct({
        ...item,
        price: priceInput.value
      });
      renderTable();
      showToast(`✓ Precio actualizado para "${item.name}"`);
    }
  });

  $("#adminTableBody").addEventListener("click", async (e) => {
    const toggleBtn = e.target.closest("[data-toggle-status]");
    if (toggleBtn) {
      const id = toggleBtn.dataset.toggleStatus;
      const item = allProducts.find((x) => (x.id || x.uid) === id);
      if (!item) return;
      const nextStatus =
        item.status === "available" ? "out_of_stock" : "available";
      await LuxoraDB.saveProduct({ ...item, status: nextStatus });
      renderTable();
      showToast(
        `✓ "${item.name}" marcado como ${
          nextStatus === "available" ? "Disponible" : "Agotado"
        }`
      );
      return;
    }

    const editBtn = e.target.closest("[data-edit-id]");
    if (editBtn) {
      const id = editBtn.dataset.editId;
      const item = allProducts.find((x) => (x.id || x.uid) === id);
      if (item) openProductModal(item);
      return;
    }

    const delBtn = e.target.closest("[data-delete-id]");
    if (delBtn) {
      const id = delBtn.dataset.deleteId;
      const item = allProducts.find((x) => (x.id || x.uid) === id);
      if (!item) return;
      if (confirm(`¿Seguro que deseas eliminar "${item.name}" (${item.brand})?`)) {
        await LuxoraDB.deleteProduct(id);
        renderTable();
        showToast(`Eliminado: "${item.name}"`);
      }
    }
  });

  // ---------- Modal de Configuración de Firebase ----------
  const fbModal = $("#firebaseModal");
  $("#openFirebaseModalBtn").addEventListener("click", () => {
    const cfg = LuxoraDB.getActiveFirebaseConfig() || {};
    $("#fbApiKey").value = cfg.apiKey || "";
    $("#fbProjectId").value = cfg.projectId || "";
    $("#fbAuthDomain").value = cfg.authDomain || "";
    $("#fbAppId").value = cfg.appId || "";
    fbModal.hidden = false;
  });

  $("#saveFbConfigBtn").addEventListener("click", async () => {
    const apiKey = $("#fbApiKey").value.trim();
    const projectId = $("#fbProjectId").value.trim();
    if (!apiKey || !projectId) {
      showToast("Ingresa al menos apiKey y projectId de tu proyecto Firebase.");
      return;
    }
    LuxoraDB.saveFirebaseConfig({
      apiKey,
      projectId,
      authDomain: $("#fbAuthDomain").value.trim() || `${projectId}.firebaseapp.com`,
      appId: $("#fbAppId").value.trim()
    });
    showToast("Conectando con Firebase Firestore...");
    const res = await LuxoraDB.init();
    updateConnectionBadge();
    renderTable();
    if (res.mode === "firebase") {
      showToast("✓ Conectado a Firebase Firestore");
    } else {
      showToast("No se pudo conectar: verifica tus credenciales.");
    }
  });

  $("#seedFirebaseBtn").addEventListener("click", async () => {
    try {
      showToast("Subiendo catálogo completo a Firebase Firestore...");
      const count = await LuxoraDB.seedToFirebase();
      showToast(`✓ ¡${count} productos sincronizados en Firebase Firestore!`);
    } catch (err) {
      showToast(err.message);
    }
  });

  $("#disconnectFbBtn").addEventListener("click", async () => {
    LuxoraDB.saveFirebaseConfig(null);
    await LuxoraDB.init();
    updateConnectionBadge();
    fbModal.hidden = true;
    showToast("Operando en Base de Datos Local");
  });

  // ---------- Modal de Configuración de la Tienda ----------
  const settingsModal = $("#settingsModal");
  $("#openSettingsModalBtn").addEventListener("click", () => {
    const s = LuxoraDB.getStoreSettings();
    $("#sWhatsapp").value = s.whatsapp || "";
    $("#sStoreName").value = s.storeName || "LUXORA";
    $("#sTagline").value = s.storeTagline || "";
    $("#sAnnouncement").value = s.announcement || "";
    settingsModal.hidden = false;
  });

  $("#settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await LuxoraDB.saveStoreSettings({
      whatsapp: $("#sWhatsapp").value.trim(),
      storeName: $("#sStoreName").value.trim(),
      storeTagline: $("#sTagline").value.trim(),
      announcement: $("#sAnnouncement").value.trim()
    });
    settingsModal.hidden = true;
    showToast("✓ Configuración de la tienda actualizada");
  });

  $("#resetFactoryBtn").addEventListener("click", async () => {
    if (
      confirm(
        "¿Deseas restaurar los 95 perfumes originales y las 12 prendas de muestra a su estado original?"
      )
    ) {
      await LuxoraDB.resetToFactoryCatalog();
      settingsModal.hidden = true;
      renderTable();
      showToast("✓ Catálogo original restaurado");
    }
  });

  // ---------- Filtros y cierres de modales ----------
  $("#adminSearch").addEventListener("input", renderTable);
  $("#adminDeptFilter").addEventListener("change", renderTable);
  $("#adminStatusFilter").addEventListener("change", renderTable);
  $("#newProductBtn").addEventListener("click", () => openProductModal(null));
  $("#newProductBtn2").addEventListener("click", () => openProductModal(null));

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-prod-modal]")) closeProductModal();
    if (e.target.closest("[data-close-fb-modal]")) fbModal.hidden = true;
    if (e.target.closest("[data-close-settings-modal]")) settingsModal.hidden = true;
  });

  // Inicializar Panel Admin
  renderTable();
  LuxoraDB.init().then(() => {
    updateConnectionBadge();
    renderTable();
  });
})();
