import { useState } from "react";
import { Toaster } from "sonner";
import { AdminPanel } from "@/components/gastrolink/admin-panel";
import { AuthPanel } from "@/components/gastrolink/auth-panel";
import { CreatorFeed } from "@/components/gastrolink/creator-feed";
import { Landing } from "@/components/gastrolink/landing";
import { RestaurantDashboard } from "@/components/gastrolink/restaurant-dashboard";
import { Logo } from "@/components/gastrolink/ui";
import type { ProfileType } from "@/domain/types";
import { GastroProvider, useGastro } from "@/state/gastro-context";

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg text-ink">
      <Logo />
      <p className="text-sm text-muted">Abrindo o mural…</p>
    </div>
  );
}

function Screens() {
  const { booted, user } = useGastro();
  const [authRole, setAuthRole] = useState<ProfileType | null>(null);
  if (!booted) return <Splash />;
  if (!user) {
    if (authRole) return <AuthPanel role={authRole} onBack={() => setAuthRole(null)} />;
    return <Landing onAuth={setAuthRole} />;
  }
  if (user.tipoPerfil === "RESTAURANTE") return <RestaurantDashboard />;
  if (user.tipoPerfil === "INFLUENCIADOR") return <CreatorFeed />;
  return <AdminPanel />;
}

export function GastroApp() {
  return (
    <GastroProvider>
      <Screens />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
          },
        }}
      />
    </GastroProvider>
  );
}
