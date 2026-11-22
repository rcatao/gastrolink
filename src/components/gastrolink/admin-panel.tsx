import { useMemo } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/gastrolink/shell";
import { Button, Kpi, StatusBadge } from "@/components/gastrolink/ui";
import { formatFollowers, formatPhone } from "@/domain/format";
import { globalKpis } from "@/services/OpportunityService";
import { useGastro } from "@/state/gastro-context";

export function AdminPanel() {
  const { db, user, moderate } = useGastro();
  const kpis = db ? globalKpis(db) : { active: 0, clicks: 0, users: 0, pending: 0 };
  const queue = useMemo(() => {
    if (!db) return [];
    return db.denuncias
      .filter((item) => item.status === "PENDENTE")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [db]);
  const history = useMemo(() => {
    if (!db) return [];
    return db.denuncias
      .filter((item) => item.status !== "PENDENTE")
      .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));
  }, [db]);

  async function decide(reportId: string, decision: "approve" | "suspend") {
    try {
      await moderate(reportId, decision);
      toast.success(decision === "suspend" ? "Oferta suspensa e removida do mural." : "Oferta mantida ativa no mural.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a decisão.");
    }
  }

  const first = user?.nomeCompleto.split(" ")[0] ?? "Marina";

  return (
    <AppShell>
      <p className="text-sm text-muted">Painel de curadoria</p>
      <h1 className="font-display text-4xl">Olá, {first}</h1>
      <p className="mt-1 text-sm text-muted">Acompanhe a tração do mural e decida as denúncias antes que uma oferta ruim afaste a rede.</p>
      <section aria-label="Indicadores globais" className="mt-5 grid grid-cols-2 gap-2">
        <Kpi label="Ofertas ativas" value={kpis.active} />
        <Kpi label="Cliques WhatsApp" value={kpis.clicks} />
        <Kpi label="Usuários" value={kpis.users} />
        <Kpi label="Denúncias pendentes" value={kpis.pending} />
      </section>
      <section className="mt-6" aria-label="Fila de moderação">
        <h2 className="font-display text-2xl">Fila de moderação</h2>
        {queue.length === 0 ? (
          <p className="mt-3 rounded-3xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
            Nenhuma denúncia pendente. O mural está limpo por enquanto.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {queue.map((report) => {
              const offer = db?.ofertas.find((item) => item.id === report.ofertaId);
              const reporter = db?.usuarios.find((item) => item.id === report.reportanteId);
              return (
                <li key={report.id} className="rounded-3xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-heat px-2.5 py-1 text-xs font-semibold text-primary-ink">PENDENTE</span>
                    {offer ? <StatusBadge status={offer.status} /> : null}
                  </div>
                  <h3 className="mt-2 text-xl">{offer?.title ?? "Oferta removida"}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {offer?.restaurantName} · {offer ? formatPhone(offer.whatsappNumber) : ""} · mín. {offer ? formatFollowers(offer.minFollowers) : "\u2014"}
                  </p>
                  <p className="mt-3 text-sm">
                    <span className="font-semibold">Oferece: </span>
                    {offer?.whatWeOffer}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">Pede: </span>
                    {offer?.whatWeAsk}
                  </p>
                  <p className="mt-3 rounded-2xl bg-bg-deep px-3 py-3 text-sm">
                    <span className="font-semibold">{reporter?.nomeCompleto ?? "Criador"} denunciou: </span>
                    {report.motivo}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button variant="line" onClick={() => void decide(report.id, "approve")}>
                      Aprovar (Manter Ativa)
                    </Button>
                    <Button variant="danger" onClick={() => void decide(report.id, "suspend")}>
                      Suspender Oferta
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="mt-8" aria-label="Histórico de decisões">
        <h2 className="font-display text-2xl">Histórico</h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {history.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">Ainda não há decisões registradas.</li>
          ) : (
            history.map((report) => {
              const offer = db?.ofertas.find((item) => item.id === report.ofertaId);
              return (
                <li key={report.id} className="px-4 py-3 text-sm">
                  <span className="font-semibold">{report.status}</span>
                  <span className="text-muted"> · {offer?.title ?? "Oferta"} · {report.motivo}</span>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </AppShell>
  );
}
