/* ============================================================
   CONFIGURACIÓN PÚBLICA DE LA TIENDA LUXORA (SOLO LECTURA)
   Conectada a Firebase Firestore (Plan Gratuito Spark - $0 costo)
   ============================================================ */
const CONFIG = {
  // Número de WhatsApp por defecto (se actualiza dinámicamente desde Firebase settings/store)
  whatsapp: "520000000000",

  storeName: "LUXORA",
  storeTagline: "Perfumería Original & Moda Exclusiva",
  city: "Envíos seguros a todo el país · Atención personalizada",

  // Credenciales oficiales del proyecto Firebase (Plan Spark Gratuito)
  firebaseConfig: {
    apiKey: "AIzaSyBoCYCajWDkTT2xbE7RkbsJTV4YzsKqrtA",
    authDomain: "luxora-perfumes-store.firebaseapp.com",
    projectId: "luxora-perfumes-store",
    storageBucket: "luxora-perfumes-store.firebasestorage.app",
    messagingSenderId: "112729514188",
    appId: "1:112729514188:web:ca6ded7db92cc48c112269"
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
    "Hola, necesito ayuda para elegir un perfume o prenda en la tienda LUXORA."
};
