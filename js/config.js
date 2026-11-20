/* ============================================================
   CONFIGURACIÓN GENERAL DE LA TIENDA LUXORA & FIREBASE
   ============================================================ */
const CONFIG = {
  // Número de WhatsApp de ventas (código de país + número, sin espacios ni símbolos)
  whatsapp: "520000000000",

  storeName: "LUXORA",
  storeTagline: "Perfumería Original & Moda Exclusiva",
  city: "Envíos seguros a todo el país · Atención personalizada",

  // PIN de acceso rápido al Panel de Administrador (puedes cambiarlo)
  adminPin: "1234",

  // ============================================================
  // CREDENCIALES DE FIREBASE (FIRESTORE DATABASE)
  // Pega aquí los datos de tu proyecto de Firebase Console
  // (Configuración del proyecto -> Tus apps -> Web App).
  // Mientras apiKey esté vacío, la tienda y el Panel Admin funcionan
  // automáticamente con la Base de Datos Local persistente.
  // ============================================================
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },

  // Mensaje al pedir un PERFUME por WhatsApp
  singleMessage:
    "Hola, quiero pedir o cotizar el perfume *{perfume}* de *{marca}* ({presentacion}){precioTxt}. ¿Tienen disponibilidad?",

  // Mensaje al pedir una PRENDA / CALZADO por WhatsApp
  singleApparelMessage:
    "Hola, quiero pedir *{prenda}* ({marca}) en *Talla {talla}* y *Color {color}*{precioTxt}. ¿Está disponible?",

  // Mensaje al enviar el pedido de "Mi Bolsa" por WhatsApp
  multiMessageHeader:
    "Hola, quiero realizar el siguiente pedido en *LUXORA*:\n\n",
  multiMessageFooter:
    "\n¿Me confirman disponibilidad, total y formas de pago/entrega por favor? ¡Gracias!",

  // Mensaje para hablar con un vendedor
  consultMessage:
    "Hola, necesito ayuda para elegir un perfume o prenda en la tienda LUXORA.",
};
