import type { Influenciador, Oferta } from "@/domain/types";

export interface DeepLink {
  message: string;
  url: string;
  phone: string;
}

export function defaultMessage(opportunity: Oferta, influencer?: Pick<Influenciador, "handle"> | null) {
  const handle = influencer?.handle ? ` (${influencer.handle})` : "";
  return (
    `Olá, ${opportunity.restaurantName}! Vim pelo mural do GastroLink. ` +
    `Tenho interesse na oferta "${opportunity.title}". ` +
    `Meu perfil${handle} atende aos requisitos exigidos (${opportunity.minFollowers}+ seguidores). Podemos agendar?`
  );
}

export function buildDeepLink(phone: string, message: string): DeepLink {
  const cleanPhone = String(phone).replace(/\D/g, "");
  return {
    message,
    phone: cleanPhone,
    url: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
  };
}

export class WhatsAppService {
  build(opportunity: Oferta, influencer?: Pick<Influenciador, "handle"> | null, message?: string) {
    return buildDeepLink(opportunity.whatsappNumber, message?.trim() || defaultMessage(opportunity, influencer));
  }
}
