import { BadgeCheck, Flag, Heart, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HandoffDialog, ReportDialog } from "@/components/gastrolink/dialogs";
import { AppShell } from "@/components/gastrolink/shell";
import { Button, TagList, controlClass } from "@/components/gastrolink/ui";
import { CATEGORIES, type FollowerFilter, type Oferta } from "@/domain/types";
import { coverFor, formatFollowers, matchesFollowerFilter, matchesSearch } from "@/domain/format";
import { useGastro } from "@/state/gastro-context";

const RANGES: { id: FollowerFilter; label: string }[] = [
  { id: "all", label: "Todos os portes" },
  { id: "1k", label: "Até 1 mil" },
  { id: "5k", label: "1 a 5 mil" },
  { id: "10k", label: "5 a 10 mil" },
  { id: "10kplus", label: "Acima de 10 mil" },
];

export function CreatorFeed() {
  const { db, user, influencer, toggleFavorite } = useGastro();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [range, setRange] = useState<FollowerFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [interest, setInterest] = useState<Oferta | null>(null);
  const [report, setReport] = useState<Oferta | null>(null);

  const offers = useMemo(() => {
    if (!db) return [];
    return db.ofertas
      .filter((offer) => offer.status === "active")
      .filter((offer) => (category === "Todas" ? true : offer.category === category))
      .filter((offer) => matchesFollowerFilter(offer.minFollowers, range))
      .filter((offer) => (favoritesOnly ? influencer?.favoriteOfferIds.includes(offer.id) : true))
      .filter((offer) => matchesSearch(offer, query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db, category, range, favoritesOnly, influencer, query]);

  const first = user?.nomeCompleto.split(" ")[0] ?? "";

  async function favorite(offerId: string) {
    try {
      const saved = influencer?.favoriteOfferIds.includes(offerId);
      await toggleFavorite(offerId);
      toast.success(saved ? "Removido dos favoritos." : "Guardado nos favoritos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível favoritar.");
    }
  }

  return (
    <AppShell>
      <p className="text-sm text-muted">Mural de oportunidades</p>
      <h1 className="font-display text-4xl">Olá, {first}</h1>
      <p className="mt-1 text-sm text-muted">
        {influencer?.handle} · {formatFollowers(influencer?.seguidores ?? 0)} seguidores. Só aparecem casas que já querem parceria.
      </p>
      <div className="sticky top-16 z-10 -mx-4 mt-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <label className="relative block">
          <span className="sr-only">Buscar ofertas</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar casa, bairro ou prato"
            className={`${controlClass} pl-10`}
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["Todas", ...CATEGORIES].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${category === item ? "bg-ink text-bg" : "bg-surface text-ink border border-line"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={range === item.id}
              onClick={() => setRange(item.id)}
              className={`h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${range === item.id ? "bg-primary text-primary-ink" : "bg-surface text-ink border border-line"}`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((value) => !value)}
            className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold ${favoritesOnly ? "bg-ink text-bg" : "bg-surface text-ink border border-line"}`}
          >
            <Heart className="size-4" />
            Favoritos
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">
        {offers.length} {offers.length === 1 ? "oportunidade aberta" : "oportunidades abertas"}
      </p>
      {offers.length === 0 ? (
        <p className="mt-3 rounded-3xl border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
          Nada com esses filtros. Limpe a busca ou troque a categoria.
        </p>
      ) : (
        <ul className="mt-3 grid gap-4">
          {offers.map((offer) => {
            const compatible = (influencer?.seguidores ?? 0) >= offer.minFollowers;
            const saved = influencer?.favoriteOfferIds.includes(offer.id) ?? false;
            return (
              <li key={offer.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
                <img src={coverFor(offer.category)} alt={`Foto ilustrativa de ${offer.category.toLocaleLowerCase("pt-BR")}`} className="aspect-video w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl">{offer.restaurantName}</h2>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
                        <MapPin className="size-4" />
                        {offer.neighborhood}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${compatible ? "bg-primary text-primary-ink" : "bg-bg-deep text-muted"}`}>
                      <BadgeCheck className="size-3.5" />
                      {compatible ? "Compatível" : `Pede ${formatFollowers(offer.minFollowers)}`}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl">{offer.title}</h3>
                  <p className="mt-2 text-sm">{offer.whatWeOffer}</p>
                  <p className="mt-1 text-sm text-muted">Entregáveis: {offer.whatWeAsk}</p>
                  <p className="mt-2 text-xs font-semibold text-muted">
                    {offer.partnershipModel} · mínimo {formatFollowers(offer.minFollowers)} seguidores
                  </p>
                  <div className="mt-3">
                    <TagList tags={offer.tags} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      aria-pressed={saved}
                      onClick={() => void favorite(offer.id)}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-line text-sm font-semibold"
                    >
                      <Heart className={`size-4 ${saved ? "text-heat" : ""}`} fill={saved ? "currentColor" : "none"} />
                      {saved ? "Favorito" : "Favoritar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReport(offer)}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-line text-sm font-semibold"
                    >
                      <Flag className="size-4" />
                      Denunciar
                    </button>
                  </div>
                  <Button variant="whatsapp" className="mt-2 w-full" onClick={() => setInterest(offer)}>
                    Tenho Interesse (WhatsApp)
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <HandoffDialog offer={interest} onOpenChange={(next) => { if (!next) setInterest(null); }} />
      <ReportDialog offer={report} onOpenChange={(next) => { if (!next) setReport(null); }} />
    </AppShell>
  );
}
