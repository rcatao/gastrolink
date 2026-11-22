/**
 * Cole as credenciais do Firebase Console para sair do modo demonstração.
 * Com apiKey e projectId vazios, o GastroLink persiste tudo neste navegador.
 * Variáveis VITE_FIREBASE_* também são lidas, se existirem no ambiente.
 */
const env = import.meta.env as Record<string, string | undefined>;

function pick(envKey: string, fallback: string) {
  const value = env[envKey];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export const firebaseConfig = {
  apiKey: pick("VITE_FIREBASE_API_KEY", ""),
  authDomain: pick("VITE_FIREBASE_AUTH_DOMAIN", ""),
  projectId: pick("VITE_FIREBASE_PROJECT_ID", ""),
  storageBucket: pick("VITE_FIREBASE_STORAGE_BUCKET", ""),
  messagingSenderId: pick("VITE_FIREBASE_MESSAGING_SENDER_ID", ""),
  appId: pick("VITE_FIREBASE_APP_ID", ""),
};

export function isFirebaseConfigured() {
  return firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;
}
