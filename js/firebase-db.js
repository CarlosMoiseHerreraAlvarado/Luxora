/* ============================================================
   MOTOR DE BASE DE DATOS LUXORA (FIREBASE FIRESTORE + LOCAL DB)
   ------------------------------------------------------------
   Colecciones en Firestore:
   1. `products` (documentos con ID único `id`)
      - id: string ("perf-0", "app-1", "prod-1732...")
      - dept: "perfumes" | "apparel"
      - brand: string (Marca)
      - name: string (Nombre comercial)
      - description: string (Descripción clara para el cliente)
      - notes: string (Notas del perfume o materiales de la prenda)
      - price: number | null (Precio opcional en MXN; null = Cotizar)
      - oldPrice: number | null (Precio anterior para mostrar oferta)
      - status: "available" | "out_of_stock" | "hidden"
      - badge: "" | "bestseller" | "new" | "promo"
      - g: "h" | "m" | "u" (Hombre, Mujer, Unisex)
      - img: string (Ruta o imagen subida)
      - [Perfumes]: cat, family, conc, sizeMl, tier
      - [Ropa]: line, subcat, fit, sizes[], colors[]
      - updatedAt: number
   2. `settings/store` (configuración general de la tienda)
   ============================================================ */

(function (global) {
  "use strict";

  const LS_PRODUCTS_KEY = "luxora_db_products_v3";
  const LS_SETTINGS_KEY = "luxora_db_settings_v3";
  const LS_FB_CONFIG_KEY = "luxora_firebase_config_v3";

  const BESTSELLER_NAMES = new Set([
    "Baccarat Rouge 540",
    "Sauvage",
    "Sauvage Elixir",
    "Bleu de Chanel Parfum",
    "Coco Mademoiselle",
    "Libre",
    "Y Men",
    "Good Girl Blush",
    "Santal 33",
    "Imagination",
    "Aventus",
    "Layton",
    "Delina Exclusif",
    "Le Male Elixir",
    "La Vie Est Belle",
    "Tobacco Vanille",
    "Eros",
    "1 Million",
    "Stronger With You Intensely",
    "Donna Born in Roma Coral Fantasy",
    "Uomo Born in Roma Intense",
    "Erba Pura"
  ]);

  const NEW_LAUNCH_NAMES = new Set([
    "Million Gold",
    "Million Gold For Her",
    "Eros Energy",
    "Paradigme",
    "La Bomba",
    "Goddess",
    "MYSLF Le Parfum",
    "Luna Rossa Ocean Le Parfum",
    "Flora Gorgeous Orchid",
    "Althaïr",
    "Absolu Aventus"
  ]);

  // Genera una descripción comercial clara y atractiva en español para cada producto base
  function buildCommercialDescription(p) {
    if (p.description && p.description.trim()) return p.description.trim();

    if (p.dept === "apparel" || p.line) {
      const styleTxt =
        p.line === "formal"
          ? "Prenda de corte elegante e impecable caída, ideal para eventos, oficina o un look casual elevado."
          : "Prenda urbana de alto gramaje con corte cómodo y moderno, pensada para uso diario con estilo.";
      return `${styleTxt} Confeccionada con ${p.notes.toLowerCase()}. Disponible en varias tallas y tonos.`;
    }

    const genderTxt =
      p.g === "h"
        ? "para hombre"
        : p.g === "m"
        ? "para mujer"
        : "unisex (para hombre y mujer)";

    const catDesc = {
      amber: "Un aroma cálido, elegante y seductor con excelente fijación y presencia. Ideal para salidas nocturnas, citas o climas templados a fríos.",
      woody: "Fragancia con carácter, sofisticada y varonil/elegante donde destacan las maderas finas. Perfecta para dejar huella en reuniones, eventos o uso diario.",
      floral: "Aroma femenino, luminoso y envolvente con flores frescas y un fondo suave que dura horas en la piel. Ideal para el día a día, oficina o eventos especiales.",
      fresh: "Perfume limpio, fresco y revitalizante que proyecta pulcritud y energía desde el primer spray. Excelente para uso diario, calor, oficina o gimnasio.",
      gourmand: "Aroma dulce, adictivo y sumamente halagado con notas cálidas que llaman la atención al instante. Ideal para fiestas, citas o noches especiales."
    };

    const base = catDesc[p.cat] || catDesc.amber;
    return `Perfume ${genderTxt} de la casa ${p.brand} (${p.conc || "Eau de Parfum"}). ${base} Sus notas principales combinan ${p.notes}.`;
  }

  // Normaliza el catálogo inicial de js/products.js al esquema completo de la BD
  function getSeedProducts() {
    const perfSeed = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).map((p, idx) => {
      const id = p.id || p.uid || `perf-${idx}`;
      let badge = p.badge || "";
      if (!badge) {
        if (BESTSELLER_NAMES.has(p.name)) badge = "bestseller";
        else if (NEW_LAUNCH_NAMES.has(p.name)) badge = "new";
      }
      const is70ml = p.brand === "Maison Francis Kurkdjian";
      const is125ml = p.brand === "Parfums de Marly" && p.g === "h";
      const is75ml = p.brand === "Parfums de Marly" && p.g === "m";
      const defaultMl = is70ml ? "70 ml" : is125ml ? "125 ml" : is75ml ? "75 ml" : "100 ml";

      return {
        id,
        uid: id,
        dept: "perfumes",
        brand: p.brand || "Marca",
        name: p.name || "Perfume",
        notes: p.notes || "",
        g: p.g || "u",
        tier: p.tier || "designer",
        cat: p.cat || "amber",
        family: p.family || "Aroma Exclusivo",
        conc: p.conc || "Eau de Parfum",
        sizeMl: p.sizeMl || defaultMl,
        img: p.img || "",
        price: typeof p.price === "number" ? p.price : null,
        oldPrice: typeof p.oldPrice === "number" ? p.oldPrice : null,
        status: p.status || "available",
        badge,
        description: buildCommercialDescription({ ...p, dept: "perfumes" }),
        order: idx,
        updatedAt: p.updatedAt || 1732000000000 + idx
      };
    });

    const appSeed = (typeof APPAREL_PRODUCTS !== "undefined" ? APPAREL_PRODUCTS : []).map((p, idx) => {
      const id = p.id || p.uid || `app-${idx}`;
      return {
        id,
        uid: id,
        dept: "apparel",
        brand: p.brand || "Luxora Studio",
        name: p.name || "Prenda",
        notes: p.notes || "",
        g: p.g || "u",
        line: p.line || "streetwear",
        subcat: p.subcat || "playeras",
        family: p.family || "Ropa & Moda",
        fit: p.fit || "Regular Fit",
        sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["S", "M", "L", "XL"],
        colors: Array.isArray(p.colors) && p.colors.length
          ? p.colors
          : [{ name: "Negro", hex: "#1b1b1b" }],
        silhouette: p.silhouette || "tee",
        img: p.img || "",
        price: typeof p.price === "number" ? p.price : null,
        oldPrice: typeof p.oldPrice === "number" ? p.oldPrice : null,
        status: p.status || "available",
        badge: p.badge || (idx < 2 ? "new" : ""),
        description: buildCommercialDescription({ ...p, dept: "apparel" }),
        order: 1000 + idx,
        updatedAt: p.updatedAt || 1732000500000 + idx
      };
    });

    return [...perfSeed, ...appSeed];
  }

  // Canal de sincronización en tiempo real entre pestañas (Admin <-> Tienda)
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("luxora_sync_channel")
      : null;

  let firestoreDb = null;
  let firebaseConnected = false;
  let changeListeners = [];

  function notifyListeners(reason) {
    changeListeners.forEach((cb) => {
      try {
        cb(reason);
      } catch (_) {}
    });
  }

  if (channel) {
    channel.onmessage = (ev) => {
      if (ev.data && ev.data.type === "DB_UPDATED") {
        notifyListeners("broadcast");
      }
    };
  }

  window.addEventListener("storage", (ev) => {
    if (ev.key === LS_PRODUCTS_KEY || ev.key === LS_SETTINGS_KEY) {
      notifyListeners("storage");
    }
  });

  // Obtiene la configuración de Firebase (desde localStorage del Admin o js/config.js)
  function getActiveFirebaseConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_FB_CONFIG_KEY) || "null");
      if (saved && saved.apiKey && saved.projectId) return saved;
    } catch (_) {}
    if (
      typeof CONFIG !== "undefined" &&
      CONFIG.firebaseConfig &&
      CONFIG.firebaseConfig.apiKey &&
      CONFIG.firebaseConfig.projectId
    ) {
      return CONFIG.firebaseConfig;
    }
    return null;
  }

  function saveFirebaseConfig(cfg) {
    if (!cfg) {
      localStorage.removeItem(LS_FB_CONFIG_KEY);
    } else {
      localStorage.setItem(LS_FB_CONFIG_KEY, JSON.stringify(cfg));
    }
  }

  // Carga local de productos (inicializa con los 95 perfumes + 12 prendas si está vacío)
  function getLocalProducts() {
    try {
      const raw = localStorage.getItem(LS_PRODUCTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    const seeded = getSeedProducts();
    try {
      localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(seeded));
    } catch (_) {}
    return seeded;
  }

  function setLocalProducts(list) {
    try {
      localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("Error guardando en localStorage:", err);
    }
  }

  // Configuración dinámica de la tienda (WhatsApp, nombre, aviso superior)
  function getStoreSettings() {
    const defaults = {
      whatsapp: (typeof CONFIG !== "undefined" && CONFIG.whatsapp) || "520000000000",
      storeName: (typeof CONFIG !== "undefined" && CONFIG.storeName) || "LUXORA",
      storeTagline:
        (typeof CONFIG !== "undefined" && CONFIG.storeTagline) ||
        "Perfumería Original & Moda Exclusiva",
      announcement:
        "Perfumes 100% Originales · Ropa Formal & Streetwear · Pide directo por WhatsApp",
      adminPin: (typeof CONFIG !== "undefined" && CONFIG.adminPin) || "1234"
    };
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) {
        return { ...defaults, ...JSON.parse(raw) };
      }
    } catch (_) {}
    return defaults;
  }

  async function saveStoreSettings(newSettings) {
    const merged = { ...getStoreSettings(), ...newSettings };
    try {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(merged));
    } catch (_) {}

    if (firebaseConnected && firestoreDb) {
      try {
        const { doc, setDoc } = await import(
          "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
        );
        await setDoc(doc(firestoreDb, "settings", "store"), merged, { merge: true });
      } catch (e) {
        console.warn("No se pudo sincronizar settings en Firebase:", e);
      }
    }
    if (channel) channel.postMessage({ type: "DB_UPDATED" });
    notifyListeners("settings");
    return merged;
  }

  // Inicializa Firebase Firestore dinámicamente si el usuario ya puso sus credenciales
  async function init() {
    // Asegurar que la base local exista con los 95 perfumes y 12 prendas
    getLocalProducts();

    const fbConfig = getActiveFirebaseConfig();
    if (!fbConfig) {
      firebaseConnected = false;
      return { mode: "local", count: getLocalProducts().length };
    }

    try {
      const { initializeApp, getApps, getApp } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
      );
      const { getFirestore, collection, getDocs, doc, getDoc, onSnapshot } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );

      const app = getApps().length ? getApp() : initializeApp(fbConfig);
      firestoreDb = getFirestore(app);

      // Escuchar cambios en tiempo real desde Firebase Firestore
      const colRef = collection(firestoreDb, "products");
      const snap = await getDocs(colRef);

      if (!snap.empty) {
        const cloudItems = [];
        snap.forEach((d) => cloudItems.push({ ...d.data(), id: d.id, uid: d.id }));
        cloudItems.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
        setLocalProducts(cloudItems);
      }

      // Leer settings de la tienda si existen en Firestore
      try {
        const setSnap = await getDoc(doc(firestoreDb, "settings", "store"));
        if (setSnap.exists()) {
          localStorage.setItem(
            LS_SETTINGS_KEY,
            JSON.stringify({ ...getStoreSettings(), ...setSnap.data() })
          );
        }
      } catch (_) {}

      // Suscripción en tiempo real a la colección `products`
      onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = [];
            snapshot.forEach((d) => items.push({ ...d.data(), id: d.id, uid: d.id }));
            items.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
            setLocalProducts(items);
            notifyListeners("firebase_realtime");
          }
        },
        (err) => {
          console.warn("Error en listener de Firestore:", err);
        }
      );

      firebaseConnected = true;
      return { mode: "firebase", projectId: fbConfig.projectId, count: getLocalProducts().length };
    } catch (err) {
      console.warn("Firebase no disponible, operando en modo Local Persistente:", err);
      firebaseConnected = false;
      return { mode: "local", error: err.message, count: getLocalProducts().length };
    }
  }

  function getAllProducts(opts = {}) {
    const list = getLocalProducts();
    if (opts.includeHidden) return list;
    return list.filter((item) => item.status !== "hidden");
  }

  async function saveProduct(productData) {
    const list = getLocalProducts();
    const id =
      productData.id ||
      productData.uid ||
      `${productData.dept === "apparel" ? "app" : "perf"}-${Date.now()}`;

    const existingIdx = list.findIndex((x) => (x.id || x.uid) === id);
    const existing = existingIdx >= 0 ? list[existingIdx] : {};

    const cleanPrice =
      productData.price !== "" &&
      productData.price !== null &&
      productData.price !== undefined &&
      !isNaN(Number(productData.price)) &&
      Number(productData.price) > 0
        ? Number(productData.price)
        : null;

    const cleanOldPrice =
      productData.oldPrice !== "" &&
      productData.oldPrice !== null &&
      productData.oldPrice !== undefined &&
      !isNaN(Number(productData.oldPrice)) &&
      Number(productData.oldPrice) > 0
        ? Number(productData.oldPrice)
        : null;

    const record = {
      ...existing,
      ...productData,
      id,
      uid: id,
      price: cleanPrice,
      oldPrice: cleanOldPrice,
      order: existing.order ?? (existingIdx >= 0 ? existingIdx : list.length),
      updatedAt: Date.now()
    };

    if (!record.description || !record.description.trim()) {
      record.description = buildCommercialDescription(record);
    }

    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }

    setLocalProducts(list);

    if (firebaseConnected && firestoreDb) {
      try {
        const { doc, setDoc } = await import(
          "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
        );
        await setDoc(doc(firestoreDb, "products", id), record);
      } catch (err) {
        console.error("Error guardando producto en Firestore:", err);
        throw err;
      }
    }

    if (channel) channel.postMessage({ type: "DB_UPDATED" });
    notifyListeners("save_product");
    return record;
  }

  async function deleteProduct(id) {
    const list = getLocalProducts().filter((x) => (x.id || x.uid) !== id);
    setLocalProducts(list);

    if (firebaseConnected && firestoreDb) {
      try {
        const { doc, deleteDoc } = await import(
          "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
        );
        await deleteDoc(doc(firestoreDb, "products", id));
      } catch (err) {
        console.error("Error eliminando producto en Firestore:", err);
        throw err;
      }
    }

    if (channel) channel.postMessage({ type: "DB_UPDATED" });
    notifyListeners("delete_product");
    return true;
  }

  // Sube todo el catálogo local actual (95 perfumes + ropa) a Firebase Firestore por lotes
  async function seedToFirebase() {
    if (!firebaseConnected || !firestoreDb) {
      throw new Error(
        "Primero configura tus credenciales de Firebase en 'Conectar Firebase'."
      );
    }
    const { doc, writeBatch } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    const items = getLocalProducts();
    const chunkSize = 400;
    for (let i = 0; i < items.length; i += chunkSize) {
      const batch = writeBatch(firestoreDb);
      items.slice(i, i + chunkSize).forEach((item) => {
        const id = item.id || item.uid;
        batch.set(doc(firestoreDb, "products", id), item);
      });
      await batch.commit();
    }
    return items.length;
  }

  // Restaura el catálogo original de fábrica (95 perfumes + 12 prendas)
  async function resetToFactoryCatalog() {
    const seeded = getSeedProducts();
    setLocalProducts(seeded);
    if (firebaseConnected && firestoreDb) {
      await seedToFirebase();
    }
    if (channel) channel.postMessage({ type: "DB_UPDATED" });
    notifyListeners("reset_catalog");
    return seeded;
  }

  // Comprime cualquier foto subida desde el celular o PC para guardarla rápido en la BD
  function compressImageFile(file, maxDim = 640, quality = 0.84) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No se seleccionó archivo"));
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, maxDim, maxDim);

          const pad = Math.round(maxDim * 0.08);
          const avail = maxDim - pad * 2;
          const scale = Math.min(avail / img.width, avail / img.height);
          const nw = Math.round(img.width * scale);
          const nh = Math.round(img.height * scale);
          const x = Math.round((maxDim - nw) / 2);
          const y = Math.round((maxDim - nh) / 2);

          ctx.drawImage(img, x, y, nw, nh);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Imagen inválida"));
        img.src = ev.target.result;
      };
      reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
      reader.readAsDataURL(file);
    });
  }

  function onChange(cb) {
    if (typeof cb === "function") changeListeners.push(cb);
  }

  function isFirebaseConnected() {
    return firebaseConnected;
  }

  global.LuxoraDB = {
    init,
    getAllProducts,
    saveProduct,
    deleteProduct,
    seedToFirebase,
    resetToFactoryCatalog,
    getStoreSettings,
    saveStoreSettings,
    getActiveFirebaseConfig,
    saveFirebaseConfig,
    compressImageFile,
    onChange,
    isFirebaseConnected,
    buildCommercialDescription
  };
})(window);
