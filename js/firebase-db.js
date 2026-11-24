/* ============================================================
   CLIENTE DE BASE DE DATOS LUXORA — TIENDA PÚBLICA (SOLO LECTURA)
   ------------------------------------------------------------
   - 100% conectado a Firebase Firestore (Plan Spark Gratuito).
   - CERO datos quemados: solo muestra los productos reales que
     existan en la colección `products` de Firebase.
   - Optimizado para consumir el mínimo de lecturas diarias
     usando un único listener en tiempo real y caché de sesión.
   - Sin funciones de escritura ni administración expuestas.
   ============================================================ */

(function (global) {
  "use strict";

  const LS_CACHE_PRODUCTS_KEY = "luxora_cloud_cache_products_v4";
  const LS_CACHE_SETTINGS_KEY = "luxora_cloud_cache_settings_v4";

  let productsList = [];
  let storeSettings = null;
  let firebaseConnected = false;
  let initialLoadComplete = false;
  let changeListeners = [];
  let unsubscribeProducts = null;
  let unsubscribeSettings = null;

  // Limpiar llaves antiguas de versiones previas con datos quemados
  try {
    localStorage.removeItem("luxora_db_products_v3");
    localStorage.removeItem("luxora_db_settings_v3");
    localStorage.removeItem("luxora_firebase_config_v3");
  } catch (_) {}

  function notifyListeners(reason) {
    changeListeners.forEach((cb) => {
      try {
        cb(reason);
      } catch (_) {}
    });
  }

  function buildCommercialDescription(p) {
    if (p.description && p.description.trim()) return p.description.trim();

    if (p.dept === "apparel" || p.line) {
      const styleTxt =
        p.line === "formal"
          ? "Prenda de corte elegante e impecable caída, ideal para eventos, oficina o un look casual elevado."
          : "Prenda urbana de alto gramaje con corte cómodo y moderno, pensada para uso diario con estilo.";
      const notesTxt = p.notes ? ` Confeccionada con ${p.notes.toLowerCase()}.` : "";
      return `${styleTxt}${notesTxt} Disponible en varias tallas y tonos.`;
    }

    const genderTxt =
      p.g === "h"
        ? "para hombre"
        : p.g === "m"
        ? "para mujer"
        : "unisex (para hombre y mujer)";

    const catDesc = {
      amber: "Un aroma cálido, elegante y seductor con excelente fijación y presencia. Ideal para salidas nocturnas, citas o climas templados a fríos.",
      woody: "Fragancia con carácter, sofisticada y elegante donde destacan las maderas finas. Perfecta para dejar huella en reuniones, eventos o uso diario.",
      floral: "Aroma luminoso y envolvente con flores frescas y un fondo suave que dura horas en la piel. Ideal para el día a día, oficina o eventos especiales.",
      fresh: "Perfume limpio, fresco y revitalizante que proyecta pulcritud y energía desde el primer spray. Excelente para uso diario, calor, oficina o gimnasio.",
      gourmand: "Aroma dulce, adictivo y sumamente halagado con notas cálidas que llaman la atención al instante. Ideal para fiestas, citas o noches especiales."
    };

    const base = catDesc[p.cat] || catDesc.amber;
    const notesPart = p.notes ? ` Sus notas principales combinan ${p.notes}.` : "";
    return `Perfume ${genderTxt} de la casa ${p.brand || "Luxora"} (${p.conc || "Eau de Parfum"}). ${base}${notesPart}`;
  }

  function getDefaultSettings() {
    return {
      whatsapp: (typeof CONFIG !== "undefined" && CONFIG.whatsapp) || "15715809800",
      storeName: (typeof CONFIG !== "undefined" && CONFIG.storeName) || "LUXORA",
      storeTagline:
        (typeof CONFIG !== "undefined" && CONFIG.storeTagline) ||
        "Perfumería Original & Moda Exclusiva",
      announcement:
        "Perfumes 100% Originales · Ropa Formal & Streetwear · Pide directo por WhatsApp",
      city:
        (typeof CONFIG !== "undefined" && CONFIG.city) ||
        "Envíos seguros · Atención personalizada"
    };
  }

  function loadCachedState() {
    try {
      const rawProducts = localStorage.getItem(LS_CACHE_PRODUCTS_KEY);
      if (rawProducts) {
        const parsed = JSON.parse(rawProducts);
        if (Array.isArray(parsed)) productsList = parsed;
      }
    } catch (_) {}

    try {
      const rawSettings = localStorage.getItem(LS_CACHE_SETTINGS_KEY);
      if (rawSettings) {
        storeSettings = { ...getDefaultSettings(), ...JSON.parse(rawSettings) };
      }
    } catch (_) {}
  }

  function saveCachedProducts(items) {
    productsList = items;
    try {
      localStorage.setItem(LS_CACHE_PRODUCTS_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  function saveCachedSettings(data) {
    storeSettings = { ...getDefaultSettings(), ...(data || {}) };
    try {
      localStorage.setItem(LS_CACHE_SETTINGS_KEY, JSON.stringify(storeSettings));
    } catch (_) {}
  }

  function getStoreSettings() {
    if (!storeSettings) loadCachedState();
    return storeSettings || getDefaultSettings();
  }

  function getAllProducts(opts = {}) {
    if (opts.includeHidden) return productsList;
    return productsList.filter((item) => item.status !== "hidden");
  }

  function isLoaded() {
    return initialLoadComplete;
  }

  function isFirebaseConnected() {
    return firebaseConnected;
  }

  async function init() {
    loadCachedState();

    const fbConfig =
      typeof CONFIG !== "undefined" &&
      CONFIG.firebaseConfig &&
      CONFIG.firebaseConfig.apiKey &&
      CONFIG.firebaseConfig.projectId
        ? CONFIG.firebaseConfig
        : null;

    if (!fbConfig) {
      initialLoadComplete = true;
      firebaseConnected = false;
      notifyListeners("no_config");
      return { mode: "unconfigured", count: 0 };
    }

    try {
      const { initializeApp, getApps, getApp } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
      );
      const { getFirestore, collection, doc, onSnapshot } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );

      const app = getApps().length ? getApp() : initializeApp(fbConfig);
      const db = getFirestore(app);

      const colRef = collection(db, "products");
      const settingsRef = doc(db, "settings", "store");

      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSettings) unsubscribeSettings();

      // Un único listener para settings/store (sin lecturas duplicadas)
      unsubscribeSettings = onSnapshot(
        settingsRef,
        (docSnap) => {
          if (docSnap.exists()) {
            saveCachedSettings(docSnap.data());
            notifyListeners("settings_realtime");
          }
        },
        (err) => {
          console.warn("Aviso al leer configuración de Firestore:", err);
        }
      );

      // Un único listener para products (refleja exactamente lo que haya en Firebase, incluso si está vacío)
      await new Promise((resolve) => {
        let resolvedOnce = false;
        unsubscribeProducts = onSnapshot(
          colRef,
          (snapshot) => {
            const items = [];
            snapshot.forEach((d) => {
              const data = d.data();
              const id = d.id;
              items.push({
                ...data,
                id,
                uid: id,
                description: buildCommercialDescription(data)
              });
            });
            items.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

            saveCachedProducts(items);
            firebaseConnected = true;
            initialLoadComplete = true;
            notifyListeners("firebase_realtime");

            if (!resolvedOnce) {
              resolvedOnce = true;
              resolve();
            }
          },
          (err) => {
            console.warn("Error en conexión con Firestore:", err);
            initialLoadComplete = true;
            notifyListeners("firebase_error");
            if (!resolvedOnce) {
              resolvedOnce = true;
              resolve();
            }
          }
        );
      });

      return {
        mode: "firebase",
        projectId: fbConfig.projectId,
        count: productsList.length
      };
    } catch (err) {
      console.warn("Error inicializando Firebase:", err);
      initialLoadComplete = true;
      firebaseConnected = false;
      notifyListeners("init_error");
      return { mode: "error", error: err.message, count: productsList.length };
    }
  }

  function onChange(cb) {
    if (typeof cb === "function") changeListeners.push(cb);
  }

  global.LuxoraDB = {
    init,
    getAllProducts,
    getStoreSettings,
    onChange,
    isLoaded,
    isFirebaseConnected,
    buildCommercialDescription
  };
})(window);
