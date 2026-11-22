import { Camera, Shield, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DEMO_ACCOUNTS } from "@/domain/seed";
import { Button, Logo } from "@/components/gastrolink/ui";
import { useGastro } from "@/state/gastro-context";
import type { ProfileType } from "@/domain/types";

export function Landing({ onAuth }: { onAuth: (role: ProfileType) => void }) {
  const { enterDemo, mode } = useGastro();
  const [pending, setPending] = useState<string | null>(null);

  async function demo(userId: string) {
    setPending(userId);
    try {
      await enterDemo(userId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <p className="text-sm text-muted">Mural de permutas</p>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-16 lg:grid-cols-2 lg:items-center">
        <section>
          <p className="text-sm font-semibold tracking-wide text-primary">Senac · Grupo 17</p>
          <h1 className="mt-2 font-display text-5xl leading-tight text-ink">Conectando Mesas a Criadores</h1>
          <p className="mt-4 max-w-md text-muted">
            Restaurantes publicam uma permuta em dois minutos. Criadores locais escolhem o que combina com o perfil e
            fecham direto no WhatsApp — sem agência e sem mensalidade.
          </p>
          <img
            src="/images/sala.jpg"
            alt="Salão de um restaurante pequeno ao entardecer"
            className="mt-6 hidden aspect-video w-full rounded-3xl object-cover lg:block"
          />
        </section>
        <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-display text-3xl">Como você entra?</h2>
          <p className="mt-1 text-sm text-muted">Escolha o perfil. O mural muda de lado, não de produto.</p>
          <div className="mt-5 grid gap-3">
            <Button variant="primary" className="h-14 w-full" onClick={() => onAuth("RESTAURANTE")}>
              <Store className="size-5" />
              Sou Restaurante
            </Button>
            <Button variant="ink" className="h-14 w-full" onClick={() => onAuth("INFLUENCIADOR")}>
              <Camera className="size-5" />
              Sou Criador de Conteúdo
            </Button>
          </div>
          <button
            type="button"
            onClick={() => onAuth("ADMIN")}
            className="mt-3 inline-flex h-11 items-center gap-2 text-sm font-medium text-muted"
          >
            <Shield className="size-4" />
            Curadoria administrativa
          </button>
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-sm font-semibold">Acesso rápido demo (1 clique)</h3>
            <p className="mt-1 text-xs text-muted">
              {mode === "local"
                ? "Entra com os dados de demonstração já carregados neste navegador."
                : "Indisponível quando o Firebase está configurado."}
            </p>
            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.userId}
                  type="button"
                  disabled={pending !== null || mode !== "local"}
                  onClick={() => void demo(account.userId)}
                  className="flex h-14 items-center justify-between rounded-2xl border border-line bg-bg px-4 text-left disabled:opacity-50"
                >
                  <span>
                    <span className="block text-sm font-semibold">{account.name}</span>
                    <span className="block text-xs text-muted">{account.detail}</span>
                  </span>
                  <span className="text-xs font-semibold text-primary">{pending === account.userId ? "Entrando\u2026" : "Entrar"}</span>
                </button>
              ))}
            </div>
            <details className="mt-4 text-sm text-muted">
              <summary className="cursor-pointer font-medium text-ink">E-mail e senha da demonstração</summary>
              <ul className="mt-2 space-y-1">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    {account.name}: {account.email} · {account.password}
                  </li>
                ))}
                <li>Chave da curadoria para novo admin: GRUPO17</li>
              </ul>
            </details>
          </div>
        </section>
        <img
          src="/images/sala.jpg"
          alt="Salão de um restaurante pequeno ao entardecer"
          className="aspect-video w-full rounded-3xl object-cover lg:hidden"
        />
      </div>
    </div>
  );
}
