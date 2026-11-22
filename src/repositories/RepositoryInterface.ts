import type { DatabaseShape, Denuncia, Influenciador, InteresseWhatsapp, Oferta, Restaurante, Usuario } from "@/domain/types";

export interface GastroRepository {
  readonly mode: "local" | "firebase";
  ready(): Promise<void>;
  setAuth(token: string | null): void;
  readAll(): Promise<DatabaseShape>;
  upsertUsuario(usuario: Usuario): Promise<void>;
  upsertRestaurante(restaurante: Restaurante): Promise<void>;
  upsertInfluenciador(influenciador: Influenciador): Promise<void>;
  upsertOferta(oferta: Oferta): Promise<void>;
  deleteOferta(id: string): Promise<void>;
  upsertInteresse(interesse: InteresseWhatsapp): Promise<void>;
  upsertDenuncia(denuncia: Denuncia): Promise<void>;
  resetDemo(): Promise<void>;
}
