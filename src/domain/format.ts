import type { Cuisine, FollowerFilter, Oferta, OfferStatus } from "@/domain/types";

export async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`gastrolink:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function formatFollowers(value: number) {
  if (value >= 1000) {
    const scaled = value / 1000;
    const text = Number.isInteger(scaled)
      ? String(scaled)
      : scaled.toFixed(1).replace(".", ",");
    return `${text} mil`;
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return raw.trim() || "não informado";
}

export function normalizeTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`));
}

export function tagsToInput(tags: string[]) {
  return tags.join(", ");
}

export function statusLabel(status: OfferStatus) {
  if (status === "active") return "ATIVA";
  if (status === "paused") return "PAUSADA";
  return "SUSPENSA";
}

export function coverFor(category: Cuisine) {
  if (category === "Hamburgueria") return "/images/burger.jpg";
  if (category === "Pizzaria") return "/images/pizza.jpg";
  if (category === "Cafeteria") return "/images/cafe.jpg";
  if (category === "Japonês") return "/images/japones.jpg";
  return "/images/caseira.jpg";
}

export function matchesFollowerFilter(minFollowers: number, filter: FollowerFilter) {
  if (filter === "all") return true;
  if (filter === "1k") return minFollowers <= 1000;
  if (filter === "5k") return minFollowers > 1000 && minFollowers <= 5000;
  if (filter === "10k") return minFollowers > 5000 && minFollowers <= 10000;
  return minFollowers > 10000;
}

export function matchesSearch(offer: Oferta, query: string) {
  const haystack = [
    offer.title,
    offer.restaurantName,
    offer.neighborhood,
    offer.category,
    offer.partnershipModel,
    offer.whatWeOffer,
    offer.whatWeAsk,
    ...offer.tags,
  ]
    .join(" ")
    .toLocaleLowerCase("pt-BR");
  return haystack.includes(query.trim().toLocaleLowerCase("pt-BR"));
}
