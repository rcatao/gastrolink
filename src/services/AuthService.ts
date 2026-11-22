import { createId } from "@/domain/ids";
import { GastroError } from "@/domain/errors";
import { hashPassword } from "@/domain/format";
import {
  CURATION_KEY,
  type RegisterAdminInput,
  type RegisterCreatorInput,
  type RegisterRestaurantInput,
  type Usuario,
} from "@/domain/types";
import type { GastroRepository } from "@/repositories/RepositoryInterface";
import { FirebaseAuthClient, type FirebaseCredential } from "@/services/firebase-auth";

export interface AuthResult {
  user: Usuario;
  idToken: string | null;
  refreshToken: string | null;
}

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertPassword(password: string) {
  if (password.trim().length < 6) throw new GastroError("A senha precisa ter pelo menos 6 caracteres.");
}

export class AuthService {
  private readonly cloud: FirebaseAuthClient | null;

  constructor(private readonly repo: GastroRepository) {
    this.cloud = repo.mode === "firebase" ? new FirebaseAuthClient() : null;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalized = cleanEmail(email);
    if (!normalized || !password) throw new GastroError("Informe e-mail e senha.");
    if (this.repo.mode === "firebase") return this.loginCloud(normalized, password);
    const db = await this.repo.readAll();
    const user = db.usuarios.find((item) => item.email === normalized);
    const hash = await hashPassword(password);
    if (!user || user.senhaHash !== hash) throw new GastroError("E-mail ou senha inválidos.");
    return { user, idToken: null, refreshToken: null };
  }

  async loginDemo(userId: string): Promise<AuthResult> {
    if (this.repo.mode !== "local") {
      throw new GastroError("O acesso rápido de 1 clique vale apenas no modo demonstração.");
    }
    const db = await this.repo.readAll();
    const user = db.usuarios.find((item) => item.id === userId);
    if (!user) throw new GastroError("Persona de demonstração não encontrada.");
    return { user, idToken: null, refreshToken: null };
  }

  async registerRestaurant(input: RegisterRestaurantInput): Promise<AuthResult> {
    assertPassword(input.senha);
    if (!input.nomeFantasia.trim() || !input.whatsapp.trim() || !input.bairro.trim()) {
      throw new GastroError("Preencha restaurante, WhatsApp e bairro.");
    }
    const email = cleanEmail(input.email);
    const cred = await this.ensureCloudUser(email, input.senha);
    await this.assertEmailFree(email, cred?.localId);
    const now = new Date().toISOString();
    const user: Usuario = {
      id: cred?.localId ?? createId("usr"),
      nomeCompleto: input.nomeCompleto.trim(),
      email,
      senhaHash: cred ? "" : await hashPassword(input.senha),
      tipoPerfil: "RESTAURANTE",
      createdAt: now,
    };
    await this.repo.upsertUsuario(user);
    await this.repo.upsertRestaurante({
      id: createId("rest"),
      usuarioId: user.id,
      nomeFantasia: input.nomeFantasia.trim(),
      documento: input.documento.trim(),
      whatsapp: input.whatsapp.replace(/\D/g, ""),
      culinaria: input.culinaria,
      bairro: input.bairro.trim(),
    });
    return { user, idToken: cred?.idToken ?? null, refreshToken: cred?.refreshToken ?? null };
  }

  async registerCreator(input: RegisterCreatorInput): Promise<AuthResult> {
    assertPassword(input.senha);
    if (!input.handle.trim()) throw new GastroError("Informe o @ do perfil.");
    if (!Number.isFinite(input.seguidores) || input.seguidores < 0) {
      throw new GastroError("Informe a quantidade de seguidores.");
    }
    const email = cleanEmail(input.email);
    const cred = await this.ensureCloudUser(email, input.senha);
    await this.assertEmailFree(email, cred?.localId);
    const handle = input.handle.trim().startsWith("@") ? input.handle.trim() : `@${input.handle.trim()}`;
    const user: Usuario = {
      id: cred?.localId ?? createId("usr"),
      nomeCompleto: input.nomeCompleto.trim(),
      email,
      senhaHash: cred ? "" : await hashPassword(input.senha),
      tipoPerfil: "INFLUENCIADOR",
      createdAt: new Date().toISOString(),
    };
    await this.repo.upsertUsuario(user);
    await this.repo.upsertInfluenciador({
      id: createId("inf"),
      usuarioId: user.id,
      handle,
      redeSocial: input.redeSocial.trim() || "Instagram",
      seguidores: Math.round(input.seguidores),
      nicho: input.nicho.trim(),
      mediaKitUrl: input.mediaKitUrl.trim(),
      favoriteOfferIds: [],
    });
    return { user, idToken: cred?.idToken ?? null, refreshToken: cred?.refreshToken ?? null };
  }

  async registerAdmin(input: RegisterAdminInput): Promise<AuthResult> {
    assertPassword(input.senha);
    if (input.chave.trim().toUpperCase() !== CURATION_KEY) {
      throw new GastroError("Chave da curadoria incorreta.");
    }
    const email = cleanEmail(input.email);
    const cred = await this.ensureCloudUser(email, input.senha);
    await this.assertEmailFree(email, cred?.localId);
    const user: Usuario = {
      id: cred?.localId ?? createId("usr"),
      nomeCompleto: input.nomeCompleto.trim(),
      email,
      senhaHash: cred ? "" : await hashPassword(input.senha),
      tipoPerfil: "ADMIN",
      createdAt: new Date().toISOString(),
    };
    await this.repo.upsertUsuario(user);
    return { user, idToken: cred?.idToken ?? null, refreshToken: cred?.refreshToken ?? null };
  }

  private async loginCloud(email: string, password: string): Promise<AuthResult> {
    if (!this.cloud) throw new GastroError("Firebase não está configurado.");
    const cred = await this.cloud.signIn(email, password);
    this.repo.setAuth(cred.idToken);
    const db = await this.repo.readAll();
    const user = db.usuarios.find((item) => item.id === cred.localId || item.email === email);
    if (!user) {
      throw new GastroError("A conta existe, mas o perfil do mural ainda não foi criado.");
    }
    return { user, idToken: cred.idToken, refreshToken: cred.refreshToken };
  }

  private async ensureCloudUser(email: string, password: string): Promise<FirebaseCredential | null> {
    if (!this.cloud) return null;
    if (!email.includes("@")) throw new GastroError("Informe um e-mail válido.");
    const cred = await this.cloud.signUp(email, password);
    this.repo.setAuth(cred.idToken);
    return cred;
  }

  private async assertEmailFree(email: string, ignoreId?: string) {
    if (!email.includes("@")) throw new GastroError("Informe um e-mail válido.");
    const db = await this.repo.readAll();
    const taken = db.usuarios.some((item) => item.email === email && item.id !== ignoreId);
    if (taken) throw new GastroError("Já existe uma conta com esse e-mail.");
  }
}
