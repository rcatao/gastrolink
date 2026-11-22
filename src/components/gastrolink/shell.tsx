import { LogOut, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/gastrolink/ui";
import { useGastro } from "@/state/gastro-context";

const ROLE: Record<string, string> = {
  RESTAURANTE: "Restaurante",
  INFLUENCIADOR: "Criador",
  ADMIN: "Curadoria",
};

export function AppShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const { user, restaurant, mode, logout, resetDemo } = useGastro();
  const who = restaurant?.nomeFantasia ?? user?.nomeCompleto ?? "";

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-between gap-3 px-4">
          <Logo />
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold">{who}</p>
            <p className="text-xs text-muted">
              {user ? ROLE[user.tipoPerfil] : ""}
              {mode === "local" ? " · demonstração" : " · nuvem"}
            </p>
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-lg px-4 pt-5 pb-28">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-4 pb-6">
        <button type="button" onClick={logout} className="inline-flex h-11 items-center gap-2 text-sm font-semibold text-ink">
          <LogOut className="size-4" />
          Sair
        </button>
        {mode === "local" ? (
          <button
            type="button"
            onClick={() => void resetDemo()}
            className="inline-flex h-11 items-center gap-2 text-sm font-medium text-muted"
          >
            <RotateCcw className="size-4" />
            Restaurar dados
          </button>
        ) : null}
        {footer}
      </footer>
    </div>
  );
}
