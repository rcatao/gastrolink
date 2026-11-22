import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CATEGORIES, PARTNERSHIPS, type Cuisine, type Oferta, type OfferInput, type PartnershipModel } from "@/domain/types";
import { formatPhone, normalizeTags, tagsToInput } from "@/domain/format";
import { buildDeepLink, defaultMessage } from "@/services/WhatsAppService";
import { Button, controlClass, Field, Modal } from "@/components/gastrolink/ui";
import { cn } from "@/lib/cn";
import { useGastro } from "@/state/gastro-context";

const REASONS = [
  "Requisitos abusivos para o porte do restaurante",
  "Número de contato inválido ou incompleto",
  "Oferta enganosa ou sem descrição real",
  "Pedido de divulgação fora do combinado",
];

function blankOffer(defaults?: { neighborhood: string; whatsapp: string; category: Cuisine }): OfferInput {
  return {
    partnershipModel: "Permuta Simples",
    category: defaults?.category ?? "Comida Caseira",
    title: "",
    whatWeOffer: "",
    whatWeAsk: "",
    minFollowers: 1000,
    neighborhood: defaults?.neighborhood ?? "",
    whatsappNumber: defaults?.whatsapp ?? "",
    tags: ["#Permuta"],
  };
}

export function OfferDialog({
  open,
  offer,
  onOpenChange,
}: {
  open: boolean;
  offer: Oferta | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { restaurant, saveOffer } = useGastro();
  const [form, setForm] = useState<OfferInput>(() => blankOffer());
  const [tags, setTags] = useState("#Permuta");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (offer) {
      setForm({
        partnershipModel: offer.partnershipModel,
        category: offer.category,
        title: offer.title,
        whatWeOffer: offer.whatWeOffer,
        whatWeAsk: offer.whatWeAsk,
        minFollowers: offer.minFollowers,
        neighborhood: offer.neighborhood,
        whatsappNumber: offer.whatsappNumber,
        tags: offer.tags,
      });
      setTags(tagsToInput(offer.tags));
    } else {
      const next = blankOffer(
        restaurant
          ? { neighborhood: restaurant.bairro, whatsapp: restaurant.whatsapp, category: restaurant.culinaria }
          : undefined,
      );
      setForm(next);
      setTags("#Permuta");
    }
  }, [open, offer, restaurant]);

  async function submit() {
    setPending(true);
    try {
      await saveOffer({ ...form, tags: normalizeTags(tags) }, offer?.id);
      toast.success(offer ? "Oferta atualizada." : "Oferta publicada no mural.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={offer ? "Editar oferta" : "Nova oferta"}
      description="Publique uma permuta objetiva. Leva menos de dois minutos."
    >
      <div className="grid gap-3">
        <Field label="Modelo de parceria">
          <select
            className={controlClass}
            value={form.partnershipModel}
            onChange={(event) => setForm({ ...form, partnershipModel: event.target.value as PartnershipModel })}
          >
            {PARTNERSHIPS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Categoria culinária">
          <select
            className={controlClass}
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value as Cuisine })}
          >
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Título">
          <input className={controlClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="O que oferecemos">
          <textarea className={cn(controlClass, "h-28 py-3")} value={form.whatWeOffer} onChange={(event) => setForm({ ...form, whatWeOffer: event.target.value })} />
        </Field>
        <Field label="O que pedimos">
          <textarea className={cn(controlClass, "h-28 py-3")} value={form.whatWeAsk} onChange={(event) => setForm({ ...form, whatWeAsk: event.target.value })} />
        </Field>
        <Field label="Mínimo de seguidores">
          <input
            className={controlClass}
            type="number"
            min={0}
            value={form.minFollowers}
            onChange={(event) => setForm({ ...form, minFollowers: Number(event.target.value) })}
          />
        </Field>
        <Field label="Bairro">
          <input className={controlClass} value={form.neighborhood} onChange={(event) => setForm({ ...form, neighborhood: event.target.value })} />
        </Field>
        <Field label="WhatsApp">
          <input className={controlClass} inputMode="tel" value={form.whatsappNumber} onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })} />
        </Field>
        <Field label="Tags" hint="Separe por vírgula. O # é colocado sozinho se faltar.">
          <input className={controlClass} value={tags} onChange={(event) => setTags(event.target.value)} />
        </Field>
        <Button className="w-full" disabled={pending} onClick={() => void submit()}>
          {pending ? "Salvando…" : offer ? "Salvar alterações" : "Publicar no mural"}
        </Button>
      </div>
    </Modal>
  );
}

export function HandoffDialog({
  offer,
  onOpenChange,
}: {
  offer: Oferta | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { influencer, expressInterest } = useGastro();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (offer) setMessage(defaultMessage(offer, influencer));
  }, [offer, influencer]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensagem copiada.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  function openWhatsapp() {
    if (!offer) return;
    const link = buildDeepLink(offer.whatsappNumber, message);
    if (!message.trim()) {
      toast.error("A mensagem não pode ficar vazia.");
      return;
    }
    if (link.phone.length < 12) {
      toast.message("O número deste estabelecimento parece incompleto. A curadoria pode suspender a oferta.");
    }
    const popup = window.open(link.url, "_blank", "noopener,noreferrer");
    setPending(true);
    void expressInterest(offer.id, message)
      .then(() => {
        toast.success("Interesse registrado. O WhatsApp foi aberto.");
        onOpenChange(false);
        if (!popup) window.location.assign(link.url);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível registrar o interesse.");
      })
      .finally(() => setPending(false));
  }

  return (
    <Modal
      open={offer !== null}
      onOpenChange={onOpenChange}
      title="Você está saindo do GastroLink"
      description="Você está sendo redirecionado para falar diretamente com o estabelecimento."
    >
      {offer ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted">
            {offer.restaurantName} · {formatPhone(offer.whatsappNumber)}
          </p>
          <Field label="Mensagem pré-formatada" hint="Você pode editar antes de enviar.">
            <textarea className={cn(controlClass, "h-40 py-3")} value={message} onChange={(event) => setMessage(event.target.value)} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="line" onClick={() => void copy()}>
              <Copy className="size-4" />
              Copiar mensagem
            </Button>
            <Button variant="whatsapp" disabled={pending} onClick={() => void openWhatsapp()}>
              {pending ? "Registrando…" : "Abrir no WhatsApp"}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export function ReportDialog({
  offer,
  onOpenChange,
}: {
  offer: Oferta | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { reportOffer } = useGastro();
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (offer) {
      setReason(REASONS[0]);
      setNote("");
    }
  }, [offer]);

  async function submit() {
    if (!offer) return;
    setPending(true);
    try {
      await reportOffer(offer.id, note.trim() ? `${reason}. ${note.trim()}` : reason);
      toast.success("Denúncia enviada à curadoria.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível denunciar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={offer !== null} onOpenChange={onOpenChange} title="Denunciar oferta" description={offer?.title}>
      <div className="grid gap-2">
        {REASONS.map((item) => (
          <label key={item} className="flex items-start gap-3 rounded-2xl border border-line px-3 py-3 text-sm">
            <input type="radio" name="motivo" className="mt-1" checked={reason === item} onChange={() => setReason(item)} />
            <span>{item}</span>
          </label>
        ))}
        <Field label="Detalhe opcional">
          <textarea className={cn(controlClass, "h-24 py-3")} value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
        <Button variant="danger" disabled={pending} onClick={() => void submit()}>
          {pending ? "Enviando…" : "Enviar denúncia"}
        </Button>
      </div>
    </Modal>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={body}>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="line" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void Promise.resolve(onConfirm()).finally(() => setPending(false));
          }}
        >
          {pending ? "Aguarde…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
