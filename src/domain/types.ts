export const CATEGORIES = [
  "Comida Caseira",
  "Hamburgueria",
  "Pizzaria",
  "Cafeteria",
  "Japonês",
] as const;

export const PARTNERSHIPS = ["Permuta Simples", "Permuta + Cachê", "Evento"] as const;

export const PROFILE_TYPES = ["RESTAURANTE", "INFLUENCIADOR", "ADMIN"] as const;

export const OFFER_STATUSES = ["active", "paused", "suspended"] as const;

export const REPORT_STATUSES = ["PENDENTE", "APROVADA", "SUSPENSA"] as const;

export type Cuisine = (typeof CATEGORIES)[number];
export type PartnershipModel = (typeof PARTNERSHIPS)[number];
export type ProfileType = (typeof PROFILE_TYPES)[number];
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type FollowerFilter = "all" | "1k" | "5k" | "10k" | "10kplus";

export interface Usuario {
  id: string;
  nomeCompleto: string;
  email: string;
  senhaHash: string;
  tipoPerfil: ProfileType;
  createdAt: string;
}

export interface Restaurante {
  id: string;
  usuarioId: string;
  nomeFantasia: string;
  documento: string;
  whatsapp: string;
  culinaria: Cuisine;
  bairro: string;
}

export interface Influenciador {
  id: string;
  usuarioId: string;
  handle: string;
  redeSocial: string;
  seguidores: number;
  nicho: string;
  mediaKitUrl: string;
  favoriteOfferIds: string[];
}

export interface Oferta {
  id: string;
  restauranteId: string;
  restaurantName: string;
  whatsappNumber: string;
  category: Cuisine;
  neighborhood: string;
  partnershipModel: PartnershipModel;
  title: string;
  whatWeOffer: string;
  whatWeAsk: string;
  minFollowers: number;
  tags: string[];
  status: OfferStatus;
  whatsappClicks: number;
  createdAt: string;
}

export interface InteresseWhatsapp {
  id: string;
  ofertaId: string;
  influenciadorId: string;
  mensagem: string;
  url: string;
  createdAt: string;
}

export interface Denuncia {
  id: string;
  ofertaId: string;
  reportanteId: string;
  adminRevisorId: string | null;
  motivo: string;
  status: ReportStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface DatabaseShape {
  usuarios: Usuario[];
  restaurantes: Restaurante[];
  influenciadores: Influenciador[];
  ofertas: Oferta[];
  interesses: InteresseWhatsapp[];
  denuncias: Denuncia[];
}

export interface OfferInput {
  partnershipModel: PartnershipModel;
  category: Cuisine;
  title: string;
  whatWeOffer: string;
  whatWeAsk: string;
  minFollowers: number;
  neighborhood: string;
  whatsappNumber: string;
  tags: string[];
}

export interface RegisterRestaurantInput {
  nomeCompleto: string;
  email: string;
  senha: string;
  nomeFantasia: string;
  documento: string;
  whatsapp: string;
  culinaria: Cuisine;
  bairro: string;
}

export interface RegisterCreatorInput {
  nomeCompleto: string;
  email: string;
  senha: string;
  handle: string;
  redeSocial: string;
  seguidores: number;
  nicho: string;
  mediaKitUrl: string;
}

export interface RegisterAdminInput {
  nomeCompleto: string;
  email: string;
  senha: string;
  chave: string;
}

export const CURATION_KEY = "GRUPO17";

export function emptyDatabase(): DatabaseShape {
  return {
    usuarios: [],
    restaurantes: [],
    influenciadores: [],
    ofertas: [],
    interesses: [],
    denuncias: [],
  };
}
