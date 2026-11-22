import { createSeed } from "@/domain/seed";
import { emptyDatabase, type DatabaseShape, type Denuncia, type Influenciador, type InteresseWhatsapp, type Oferta, type Restaurante, type Usuario } from "@/domain/types";
import type { GastroRepository } from "@/repositories/RepositoryInterface";

const STORAGE_KEY = "gastrolink.db.v1";

type Envelope = { version: 1; data: DatabaseShape };

function upsert<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) list.push(item);
  else list[index] = item;
}

function readStored(): DatabaseShape | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Envelope;
    if (parsed.version !== 1 || !parsed.data?.usuarios || !parsed.data.ofertas) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export class LocalStorageRepository implements GastroRepository {
  readonly mode = "local" as const;
  private db: DatabaseShape = emptyDatabase();
  private hydrated = false;

  setAuth(_token: string | null) {}

  async ready() {
    if (this.hydrated || typeof window === "undefined") return;
    this.db = readStored() ?? createSeed();
    this.persist();
    this.hydrated = true;
  }

  async readAll() {
    await this.ready();
    return structuredClone(this.db);
  }

  async upsertUsuario(usuario: Usuario) {
    await this.write((db) => upsert(db.usuarios, usuario));
  }

  async upsertRestaurante(restaurante: Restaurante) {
    await this.write((db) => upsert(db.restaurantes, restaurante));
  }

  async upsertInfluenciador(influenciador: Influenciador) {
    await this.write((db) => upsert(db.influenciadores, influenciador));
  }

  async upsertOferta(oferta: Oferta) {
    await this.write((db) => upsert(db.ofertas, oferta));
  }

  async deleteOferta(id: string) {
    await this.write((db) => {
      db.ofertas = db.ofertas.filter((offer) => offer.id !== id);
    });
  }

  async upsertInteresse(interesse: InteresseWhatsapp) {
    await this.write((db) => upsert(db.interesses, interesse));
  }

  async upsertDenuncia(denuncia: Denuncia) {
    await this.write((db) => upsert(db.denuncias, denuncia));
  }

  async resetDemo() {
    await this.ready();
    this.db = createSeed();
    this.persist();
  }

  private async write(mutate: (db: DatabaseShape) => void) {
    await this.ready();
    mutate(this.db);
    this.persist();
  }

  private persist() {
    if (typeof window === "undefined") return;
    const envelope: Envelope = { version: 1, data: this.db };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  }
}
