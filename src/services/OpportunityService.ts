import { createId } from "@/domain/ids";
import { GastroError } from "@/domain/errors";
import type {
  DatabaseShape,
  Denuncia,
  Influenciador,
  Oferta,
  OfferInput,
  Restaurante,
  Usuario,
} from "@/domain/types";
import type { GastroRepository } from "@/repositories/RepositoryInterface";
import { WhatsAppService } from "@/services/WhatsAppService";

function requireText(value: string, label: string) {
  if (!value.trim()) throw new GastroError(`Preencha ${label}.`);
  return value.trim();
}

export class OpportunityService {
  private readonly whatsapp = new WhatsAppService();

  constructor(private readonly repo: GastroRepository) {}

  async saveOffer(restaurant: Restaurante, input: OfferInput, existingId?: string) {
    const title = requireText(input.title, "o título");
    const whatWeOffer = requireText(input.whatWeOffer, "o que o restaurante oferece");
    const whatWeAsk = requireText(input.whatWeAsk, "o que é pedido em troca");
    const neighborhood = requireText(input.neighborhood, "o bairro");
    const whatsappNumber = input.whatsappNumber.replace(/\D/g, "");
    if (whatsappNumber.length < 10) throw new GastroError("Informe um WhatsApp com DDD.");
    if (!Number.isFinite(input.minFollowers) || input.minFollowers < 0) {
      throw new GastroError("Informe o mínimo de seguidores.");
    }
    const db = await this.repo.readAll();
    const current = existingId ? db.ofertas.find((offer) => offer.id === existingId) : undefined;
    if (existingId && (!current || current.restauranteId !== restaurant.id)) {
      throw new GastroError("Você não pode alterar esta oferta.");
    }
    const offer: Oferta = {
      id: current?.id ?? createId("opp"),
      restauranteId: restaurant.id,
      restaurantName: restaurant.nomeFantasia,
      whatsappNumber,
      category: input.category,
      neighborhood,
      partnershipModel: input.partnershipModel,
      title,
      whatWeOffer,
      whatWeAsk,
      minFollowers: Math.round(input.minFollowers),
      tags: input.tags.length > 0 ? input.tags : ["#Permuta"],
      status: current?.status ?? "active",
      whatsappClicks: current?.whatsappClicks ?? 0,
      createdAt: current?.createdAt ?? new Date().toISOString(),
    };
    await this.repo.upsertOferta(offer);
    return offer;
  }

  async setPaused(restaurant: Restaurante, offerId: string, paused: boolean) {
    const offer = await this.owned(restaurant, offerId);
    if (offer.status === "suspended") {
      throw new GastroError("Esta oferta está suspensa pela curadoria.");
    }
    offer.status = paused ? "paused" : "active";
    await this.repo.upsertOferta(offer);
  }

  async deleteOffer(restaurant: Restaurante, offerId: string) {
    await this.owned(restaurant, offerId);
    await this.repo.deleteOferta(offerId);
  }

  async expressInterest(influencer: Influenciador, offerId: string, message: string) {
    const db = await this.repo.readAll();
    const offer = db.ofertas.find((item) => item.id === offerId);
    if (!offer || offer.status !== "active") throw new GastroError("Esta oferta não está mais no mural.");
    const text = message.trim();
    if (!text) throw new GastroError("A mensagem não pode ficar vazia.");
    const link = this.whatsapp.build(offer, influencer, text);
    const next = { ...offer, whatsappClicks: offer.whatsappClicks + 1 };
    await this.repo.upsertOferta(next);
    await this.repo.upsertInteresse({
      id: createId("int"),
      ofertaId: offer.id,
      influenciadorId: influencer.id,
      mensagem: text,
      url: link.url,
      createdAt: new Date().toISOString(),
    });
    return link;
  }

  async reportOffer(reporter: Usuario, offerId: string, motivo: string) {
    if (reporter.tipoPerfil !== "INFLUENCIADOR") {
      throw new GastroError("Apenas criadores podem denunciar uma oferta.");
    }
    const reason = requireText(motivo, "o motivo da denúncia");
    const db = await this.repo.readAll();
    const offer = db.ofertas.find((item) => item.id === offerId);
    if (!offer) throw new GastroError("Oferta não encontrada.");
    const pending = db.denuncias.some(
      (item) => item.ofertaId === offerId && item.reportanteId === reporter.id && item.status === "PENDENTE",
    );
    if (pending) throw new GastroError("Você já enviou uma denúncia pendente para esta oferta.");
    const report: Denuncia = {
      id: createId("den"),
      ofertaId: offerId,
      reportanteId: reporter.id,
      adminRevisorId: null,
      motivo: reason,
      status: "PENDENTE",
      createdAt: new Date().toISOString(),
      decidedAt: null,
    };
    await this.repo.upsertDenuncia(report);
  }

  async toggleFavorite(influencer: Influenciador, offerId: string) {
    const has = influencer.favoriteOfferIds.includes(offerId);
    const favoriteOfferIds = has
      ? influencer.favoriteOfferIds.filter((id) => id !== offerId)
      : [...influencer.favoriteOfferIds, offerId];
    await this.repo.upsertInfluenciador({ ...influencer, favoriteOfferIds });
  }

  async moderate(admin: Usuario, reportId: string, decision: "approve" | "suspend") {
    if (admin.tipoPerfil !== "ADMIN") throw new GastroError("Apenas a curadoria pode moderar.");
    const db = await this.repo.readAll();
    const report = db.denuncias.find((item) => item.id === reportId);
    if (!report || report.status !== "PENDENTE") throw new GastroError("Esta denúncia já foi decidida.");
    const offer = db.ofertas.find((item) => item.id === report.ofertaId);
    if (!offer) throw new GastroError("A oferta denunciada não existe mais.");
    const decidedAt = new Date().toISOString();
    if (decision === "suspend") {
      await this.repo.upsertOferta({ ...offer, status: "suspended" });
      for (const item of db.denuncias.filter((entry) => entry.ofertaId === offer.id && entry.status === "PENDENTE")) {
        await this.repo.upsertDenuncia({
          ...item,
          status: "SUSPENSA",
          adminRevisorId: admin.id,
          decidedAt,
        });
      }
      return;
    }
    await this.repo.upsertOferta({ ...offer, status: "active" });
    await this.repo.upsertDenuncia({
      ...report,
      status: "APROVADA",
      adminRevisorId: admin.id,
      decidedAt,
    });
  }

  private async owned(restaurant: Restaurante, offerId: string) {
    const db = await this.repo.readAll();
    const offer = db.ofertas.find((item) => item.id === offerId);
    if (!offer || offer.restauranteId !== restaurant.id) {
      throw new GastroError("Você não pode alterar esta oferta.");
    }
    return offer;
  }
}

export function restaurantKpis(db: DatabaseShape, restaurantId: string) {
  const mine = db.ofertas.filter((offer) => offer.restauranteId === restaurantId);
  return {
    active: mine.filter((offer) => offer.status === "active").length,
    paused: mine.filter((offer) => offer.status === "paused").length,
    clicks: mine.reduce((sum, offer) => sum + offer.whatsappClicks, 0),
  };
}

export function globalKpis(db: DatabaseShape) {
  return {
    active: db.ofertas.filter((offer) => offer.status === "active").length,
    clicks: db.ofertas.reduce((sum, offer) => sum + offer.whatsappClicks, 0),
    users: db.usuarios.length,
    pending: db.denuncias.filter((item) => item.status === "PENDENTE").length,
  };
}
