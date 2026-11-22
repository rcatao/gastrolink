import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { OfferStatus } from "@/domain/types";
import { statusLabel } from "@/domain/format";

type Variant = "primary" | "ink" | "whatsapp" | "line" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink",
  ink: "bg-ink text-bg",
  whatsapp: "bg-whatsapp text-whatsapp-ink",
  line: "border border-line bg-surface text-ink",
  ghost: "bg-transparent text-ink",
  danger: "bg-heat text-primary-ink",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

export const controlClass =
  "h-12 w-full rounded-2xl border border-line bg-bg px-3 text-base text-ink outline-none";

export function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-3xl leading-none text-ink tabular-nums">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: OfferStatus }) {
  const className =
    status === "active"
      ? "bg-primary text-primary-ink"
      : status === "paused"
        ? "bg-bg-deep text-muted"
        : "bg-heat text-primary-ink";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide", className)}>
      {statusLabel(status)}
    </span>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const lower = tag.toLocaleLowerCase("pt-BR");
        const className = lower.includes("permuta")
          ? "bg-primary text-primary-ink"
          : lower.includes("seguidor") || lower.includes("k")
            ? "bg-ink text-bg"
            : "bg-bg-deep text-ink";
        return (
          <li key={tag} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
            {tag}
          </li>
        );
      })}
    </ul>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-dvh overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-lg sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-2xl text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-bg-deep" aria-label="Fechar">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-ink">
        G
      </span>
      {compact ? null : <span className="font-display text-xl leading-none">GastroLink</span>}
    </span>
  );
}
