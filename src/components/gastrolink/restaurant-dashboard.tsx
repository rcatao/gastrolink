import { Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog, OfferDialog } from "@/components/gastrolink/dialogs";
import { AppShell } from "@/components/gastrolink/shell";
import { Kpi, StatusBadge, TagList } from "@/components/gastrolink/ui";
import { formatFollowers } from "@/domain/format";
import type { Oferta } from "@/domain/types";
import { restaurantKpis } from "@/services/OpportunityService";
import { useGastro } from "@/state/gastro-context";

export function RestaurantDashboard() {
  const { db, user, restaurant, pauseOffer, deleteOffer } = useGastro();
  const [composer, setComposer] = useState(false);
  const [editing, setEditing] = useState<Oferta | null>(null);
  const [removing, setRemoving] = useState<Oferta | null>(null);

  const offers = useMemo(() => {
    if (!db || !restaurant) return [];
    return db.ofertas
      .filter((offer) => offer.restauranteId === restaurant.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db, restaurant]);

  const kpis = db && restaurant ? restaurantKpis(db, restaurant.id) : { active: 0, paused: 0, clicks: 0 };
  const first = user?.nomeCompleto.split(" ")[0] ?? "";

  async function toggle(offer: Oferta) {
    try {
      const paused = offer.status === "active";
      await pauseOffer(offer.id, paused);
      toast.success(paused ? "Oferta pausada. Ela saiu do mural." : "Oferta reativada no mural.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o status.");
    }
  }

  return (
    <AppShell>
      <p className="text-sm text-muted">Painel do estabelecimento</p>
      <h1 className="font-display text-4xl">Olá, {first}</h1>
      <p className="mt-1 text-sm text-muted">{restaurant?.nomeFantasia}. Publique, pause ou encerre uma permuta.</p>
      <section aria-label="Indicadores" className="mt-5 grid grid-cols-3 gap-2">
        <Kpi label="Ofertas ativas" value={kpis.active} />
        <Kpi label="Cliques WhatsApp" value={kpis.clicks} />
        <Kpi label="Ofertas pausadas" value={kpis.paused} />
      </section>
      <section className="mt-6" aria-label="Suas ofertas">
        <h2 className="font-display text-2xl">Suas parcerias</h2>
        {offers.length === 0 ? (
          <p className="mt-3 rounded-3xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
            Nenhuma oferta ainda. Toque em + para publicar em menos de dois minutos.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
            {offers.map((offer) => (
              <li key={offer.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={offer.status} />
                      <span className="text-xs text-muted">{offer.partnershipModel}</span>
                    </div>
                    <h3 className="mt-2 text-xl">{offer.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {offer.category} · mín. {formatFollowers(offer.minFollowers)} seguidores · {offer.whatsappClicks} cliques
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm">{offer.whatWeOffer}</p>
                <p className="mt-1 text-sm text-muted">Em troca: {offer.whatWeAsk}</p>
                <div className="mt-3">
                  <TagList tags={offer.tags} />
                </div>
                {offer.status === "suspended" ? (
                  <p className="mt-3 text-sm font-medium text-heat">Suspensa pela curadoria. Ela não aparece para os criadores.</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-line px-3 text-sm font-semibold" onClick={() => setEditing(offer)}>
                    <Pencil className="size-4" />
                    Editar
                  </button>
                  {offer.status !== "suspended" ? (
                    <button type="button" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-line px-3 text-sm font-semibold" onClick={() => void toggle(offer)}>
                      {offer.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
                      {offer.status === "paused" ? "Reativar" : "Pausar"}
                    </button>
                  ) : null}
                  <button type="button" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-line px-3 text-sm font-semibold text-heat" onClick={() => setRemoving(offer)}>
                    <Trash2 className="size-4" />
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto flex w-full max-w-lg justify-end px-4 pb-5">
          <button
            type="button"
            aria-label="Publicar oferta"
            onClick={() => setComposer(true)}
            className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-ink shadow-lg"
          >
            <Plus className="size-7" />
          </button>
        </div>
      </div>
      <OfferDialog open={composer || editing !== null} offer={editing} onOpenChange={(next) => {
        if (!next) {
          setComposer(false);
          setEditing(null);
        }
      }} />
      <ConfirmDialog
        open={removing !== null}
        title="Excluir oferta?"
        body={removing ? `“${removing.title}” sai do mural e o histórico de cliques desta oferta deixa de aparecer aqui.` : ""}
        confirmLabel="Excluir"
        onOpenChange={(next) => {
          if (!next) setRemoving(null);
        }}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await deleteOffer(removing.id);
            toast.success("Oferta excluída.");
            setRemoving(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
          }
        }}
      />
    </AppShell>
  );
}
