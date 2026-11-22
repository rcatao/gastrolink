import { firebaseConfig } from "@/config/firebaseConfig";
import { GastroError } from "@/domain/errors";

export interface FirebaseCredential {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
}

const MESSAGES: Record<string, string> = {
  EMAIL_NOT_FOUND: "Não encontramos uma conta com esse e-mail.",
  INVALID_PASSWORD: "Senha incorreta.",
  INVALID_LOGIN_CREDENTIALS: "E-mail ou senha inválidos.",
  EMAIL_EXISTS: "Já existe uma conta com esse e-mail.",
  WEAK_PASSWORD: "Use uma senha com pelo menos 6 caracteres.",
  INVALID_EMAIL: "Informe um e-mail válido.",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Muitas tentativas. Espere um instante e tente de novo.",
};

function mapError(code: string) {
  const key = code.replace(" : ", "").split(" ")[0] ?? code;
  return MESSAGES[key] ?? "Não foi possível autenticar no Firebase.";
}

async function post(path: string, body: object): Promise<FirebaseCredential> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    },
  );
  const json = (await response.json().catch(() => ({}))) as {
    idToken?: string;
    refreshToken?: string;
    localId?: string;
    email?: string;
    error?: { message?: string };
  };
  if (!response.ok || !json.idToken || !json.localId || !json.refreshToken) {
    throw new GastroError(mapError(json.error?.message ?? ""));
  }
  return {
    idToken: json.idToken,
    refreshToken: json.refreshToken,
    localId: json.localId,
    email: (json.email ?? "").toLowerCase(),
  };
}

export class FirebaseAuthClient {
  signIn(email: string, password: string) {
    return post("accounts:signInWithPassword", { email, password });
  }

  signUp(email: string, password: string) {
    return post("accounts:signUp", { email, password });
  }
}
