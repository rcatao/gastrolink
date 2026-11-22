import { firebaseConfig } from "@/config/firebaseConfig";
import {
  emptyDatabase,
  type DatabaseShape,
  type Denuncia,
  type Influenciador,
  type InteresseWhatsapp,
  type Oferta,
  type Restaurante,
  type Usuario,
} from "@/domain/types";
import { GastroError } from "@/domain/errors";
import type { GastroRepository } from "@/repositories/RepositoryInterface";

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FsValue[] } };

const COLLECTIONS = {
  usuarios: "usuarios",
  restaurantes: "restaurantes",
  influenciadores: "influenciadores",
  ofertas: "ofertas",
  interesses: "interesses_whatsapp",
  denuncias: "moderacao_denuncias",
} as const;

function encode(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isFinite(value)) return { integerValue: String(Math.trunc(value)) };
  if (Array.isArray(value)) return { arrayValue: { values: value.map((item) => encode(item)) } };
  return { stringValue: String(value) };
}

function decode(value: FsValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map((item) => decode(item));
  return null;
}

function encodeFields(record: object) {
  const fields: Record<string, FsValue> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === "id") continue;
    fields[key] = encode(value);
  }
  return fields;
}

function decodeFields(fields: Record<string, FsValue> | undefined) {
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields ?? {})) record[key] = decode(value);
  return record;
}

export class FirebaseRepository implements GastroRepository {
  readonly mode = "firebase" as const;
  private token: string | null = null;
  private readonly projectId = firebaseConfig.projectId;
  private readonly base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

  async ready() {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new GastroError("Firebase não está configurado.");
    }
  }

  setAuth(token: string | null) {
    this.token = token;
  }

  async readAll(): Promise<DatabaseShape> {
    await this.ready();
    if (!this.token) return emptyDatabase();
    const [usuarios, restaurantes, influenciadores, ofertas, interesses, denuncias] = await Promise.all([
      this.listCollection(COLLECTIONS.usuarios),
      this.listCollection(COLLECTIONS.restaurantes),
      this.listCollection(COLLECTIONS.influenciadores),
      this.listCollection(COLLECTIONS.ofertas),
      this.listCollection(COLLECTIONS.interesses),
      this.listCollection(COLLECTIONS.denuncias),
    ]);
    return {
      usuarios: usuarios.map(asUsuario),
      restaurantes: restaurantes.map(asRestaurante),
      influenciadores: influenciadores.map(asInfluenciador),
      ofertas: ofertas.map(asOferta),
      interesses: interesses.map(asInteresse),
      denuncias: denuncias.map(asDenuncia),
    };
  }

  async upsertUsuario(usuario: Usuario) {
    await this.commitUpsert(COLLECTIONS.usuarios, usuario.id, usuario);
  }

  async upsertRestaurante(restaurante: Restaurante) {
    await this.commitUpsert(COLLECTIONS.restaurantes, restaurante.id, restaurante);
  }

  async upsertInfluenciador(influenciador: Influenciador) {
    await this.commitUpsert(COLLECTIONS.influenciadores, influenciador.id, influenciador);
  }

  async upsertOferta(oferta: Oferta) {
    await this.commitUpsert(COLLECTIONS.ofertas, oferta.id, oferta);
  }

  async deleteOferta(id: string) {
    await this.commitDelete(COLLECTIONS.ofertas, id);
  }

  async upsertInteresse(interesse: InteresseWhatsapp) {
    await this.commitUpsert(COLLECTIONS.interesses, interesse.id, interesse);
  }

  async upsertDenuncia(denuncia: Denuncia) {
    await this.commitUpsert(COLLECTIONS.denuncias, denuncia.id, denuncia);
  }

  async resetDemo() {
    throw new GastroError("A restauração de demonstração só existe no modo local.");
  }

  private docName(collection: string, id: string) {
    return `projects/${this.projectId}/databases/(default)/documents/${collection}/${id}`;
  }

  private async commitUpsert(collection: string, id: string, record: object) {
    await this.ready();
    await this.request(`${this.base}:commit`, {
      method: "POST",
      body: JSON.stringify({
        writes: [{ update: { name: this.docName(collection, id), fields: encodeFields(record) } }],
      }),
    });
  }

  private async commitDelete(collection: string, id: string) {
    await this.ready();
    await this.request(`${this.base}:commit`, {
      method: "POST",
      body: JSON.stringify({ writes: [{ delete: this.docName(collection, id) }] }),
    });
  }

  private async listCollection(collection: string) {
    const rows: Record<string, unknown>[] = [];
    let pageToken = "";
    do {
      const url = new URL(`${this.base}/${collection}`);
      url.searchParams.set("pageSize", "200");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const json = await this.request(url.toString());
      const documents = (json.documents ?? []) as Array<{ name?: string; fields?: Record<string, FsValue> }>;
      for (const document of documents) {
        const id = document.name?.split("/").pop() ?? "";
        rows.push({ id, ...decodeFields(document.fields) });
      }
      pageToken = typeof json.nextPageToken === "string" ? json.nextPageToken : "";
    } while (pageToken);
    return rows;
  }

  private async request(url: string, init?: RequestInit) {
    if (!this.token) throw new GastroError("Entre na sua conta para acessar o mural na nuvem.");
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (response.status === 404) return {};
    const json = (await response.json().catch(() => ({}))) as { error?: { message?: string } } & Record<string, unknown>;
    if (!response.ok) {
      throw new GastroError(json.error?.message || "Não foi possível falar com o Firestore.");
    }
    return json;
  }
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function asUsuario(row: Record<string, unknown>): Usuario {
  const perfil = asString(row.tipoPerfil, "INFLUENCIADOR");
  return {
    id: asString(row.id),
    nomeCompleto: asString(row.nomeCompleto),
    email: asString(row.email).toLowerCase(),
    senhaHash: asString(row.senhaHash),
    tipoPerfil: perfil === "RESTAURANTE" || perfil === "ADMIN" ? perfil : "INFLUENCIADOR",
    createdAt: asString(row.createdAt, new Date().toISOString()),
  };
}

function asRestaurante(row: Record<string, unknown>): Restaurante {
  return {
    id: asString(row.id),
    usuarioId: asString(row.usuarioId),
    nomeFantasia: asString(row.nomeFantasia),
    documento: asString(row.documento),
    whatsapp: asString(row.whatsapp),
    culinaria: asCuisine(row.culinaria),
    bairro: asString(row.bairro),
  };
}

function asInfluenciador(row: Record<string, unknown>): Influenciador {
  return {
    id: asString(row.id),
    usuarioId: asString(row.usuarioId),
    handle: asString(row.handle),
    redeSocial: asString(row.redeSocial, "Instagram"),
    seguidores: asNumber(row.seguidores),
    nicho: asString(row.nicho),
    mediaKitUrl: asString(row.mediaKitUrl),
    favoriteOfferIds: asStringList(row.favoriteOfferIds),
  };
}

function asOferta(row: Record<string, unknown>): Oferta {
  const status = asString(row.status, "active");
  const partnership = asString(row.partnershipModel, "Permuta Simples");
  return {
    id: asString(row.id),
    restauranteId: asString(row.restauranteId),
    restaurantName: asString(row.restaurantName),
    whatsappNumber: asString(row.whatsappNumber),
    category: asCuisine(row.category),
    neighborhood: asString(row.neighborhood),
    partnershipModel:
      partnership === "Permuta + Cachê" || partnership === "Evento" ? partnership : "Permuta Simples",
    title: asString(row.title),
    whatWeOffer: asString(row.whatWeOffer),
    whatWeAsk: asString(row.whatWeAsk),
    minFollowers: asNumber(row.minFollowers),
    tags: asStringList(row.tags),
    status: status === "paused" || status === "suspended" ? status : "active",
    whatsappClicks: asNumber(row.whatsappClicks),
    createdAt: asString(row.createdAt, new Date().toISOString()),
  };
}

function asInteresse(row: Record<string, unknown>): InteresseWhatsapp {
  return {
    id: asString(row.id),
    ofertaId: asString(row.ofertaId),
    influenciadorId: asString(row.influenciadorId),
    mensagem: asString(row.mensagem),
    url: asString(row.url),
    createdAt: asString(row.createdAt, new Date().toISOString()),
  };
}

function asDenuncia(row: Record<string, unknown>): Denuncia {
  const status = asString(row.status, "PENDENTE");
  return {
    id: asString(row.id),
    ofertaId: asString(row.ofertaId),
    reportanteId: asString(row.reportanteId),
    adminRevisorId: row.adminRevisorId ? asString(row.adminRevisorId) : null,
    motivo: asString(row.motivo),
    status: status === "APROVADA" || status === "SUSPENSA" ? status : "PENDENTE",
    createdAt: asString(row.createdAt, new Date().toISOString()),
    decidedAt: row.decidedAt ? asString(row.decidedAt) : null,
  };
}

function asCuisine(value: unknown) {
  const text = asString(value, "Comida Caseira");
  if (text === "Hamburgueria" || text === "Pizzaria" || text === "Cafeteria" || text === "Japonês") return text;
  return "Comida Caseira" as const;
}
