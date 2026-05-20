// ===== Kontigo · Configuración =====
// INSTRUCCIONES:
// 1. Ve a Firebase Console → kapital-app-prod → Configuración del proyecto → Tus apps → Web
// 2. Copia el firebaseConfig y reemplaza los valores de abajo
// 3. Cambia API_BASE_URL por el dominio real de tu backend cuando lo despliegues
//    (por ejemplo: "https://api.tudominio.com")

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAXH20HY1VDhyLTmohMsKp4n6utSeUEn98",
  authDomain: "kapital-app-prod.firebaseapp.com",
  projectId: "kapital-app-prod",
  storageBucket: "kapital-app-prod.firebasestorage.app",
  messagingSenderId: "777890091357",
  appId: "1:777890091357:web:ecd56c064e6a85ba6d18b4",
};

// URL base del backend (sin slash al final)
// En desarrollo local: "http://localhost:3000"
// En producción: "https://tu-backend.tudominio.com"
const API_BASE_URL = "https://kontigo-backend.76-13-161-248.nip.io";

window.KONTIGO_CONFIG = { FIREBASE_CONFIG, API_BASE_URL };
