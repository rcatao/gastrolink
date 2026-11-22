import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GastroError } from "@/domain/errors";
import type {
  DatabaseShape,
  Influenciador,
  OfferInput,
  RegisterAdminInput,
  RegisterCreatorInput,
  RegisterRestaurantInput,
  Restaurante,
  Usuario,
} from "@/domain/types";
import { createRepository } from "@/repositories/RepositoryFactory";
import type { GastroRepository } from "@/repositories/RepositoryInterface";
import { AuthService, type AuthResult } from "@/services/AuthService";
import { OpportunityService } from "@/services/OpportunityService";
import { clearSession, readSession, writeSession } from "@/services/session";

interface GastroApi {
  booted: boolean;
  mode: "local" | "firebase";
  db: DatabaseShape | null;
  user: Usuario | null;
  restaurant: Restaurante | null;
  influencer: Influenciador | null;
  enterDemo: (userId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerRestaurant: (input: RegisterRestaurantInput) => Promise<void>;
  registerCreator: (input: RegisterCreatorInput) => Promise<void>;
  registerAdmin: (input: RegisterAdminInput) => Promise<void>;
  logout: () => void;
  resetDemo: () => Promise<void>;
  saveOffer: (input: OfferInput, existingId?: string) => Promise<void>;
  pauseOffer: (id: string, paused: boolean) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  expressInterest: (offerId: string, message: string) => Promise<string>;
  reportOffer: (offerId: string, motivo: string) => Promise<void>;
  toggleFavorite: (offerId: string) => Promise<void>;
  moderate: (reportId: string, decision: "approve" | "suspend") => Promise<void>;
}

const GastroContext = createContext<GastroApi | null>(null);

export function GastroProvider({ children }: { children: ReactNode }) {
  const repoRef = useRef<GastroRepository | null>(null);
  const authRef = useRef<AuthService | null>(null);
  const offersRef = useRef<OpportunityService | null>(null);
  const [booted, setBooted] = useState(false);
  const [mode, setMode] = useState<"local" | "firebase">("local");
  const [db, setDb] = useState<DatabaseShape | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const repo = repoRef.current;
    if (!repo) return;
    setDb(await repo.readAll());
  }, []);

  const adopt = useCallback(
    async (result: AuthResult) => {
      const repo = repoRef.current;
      if (!repo) return;
      repo.setAuth(result.idToken);
      writeSession({
        userId: result.user.id,
        idToken: result.idToken,
        refreshToken: result.refreshToken,
      });
      setUserId(result.user.id);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    let cancelled = false;
    const repo = createRepository();
    repoRef.current = repo;
    authRef.current = new AuthService(repo);
    offersRef.current = new OpportunityService(repo);
    void (async () => {
      await repo.ready();
      const session = readSession();
      if (session?.idToken) repo.setAuth(session.idToken);
      const data = await repo.readAll();
      if (cancelled) return;
      setMode(repo.mode);
      setDb(data);
      if (session && data.usuarios.some((user) => user.id === session.userId)) setUserId(session.userId);
      else if (session) clearSession();
      setBooted(true);
    })().catch(() => {
      if (!cancelled) setBooted(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const user = useMemo(() => db?.usuarios.find((item) => item.id === userId) ?? null, [db, userId]);
  const restaurant = useMemo(
    () => (user ? (db?.restaurantes.find((item) => item.usuarioId === user.id) ?? null) : null),
    [db, user],
  );
  const influencer = useMemo(
    () => (user ? (db?.influenciadores.find((item) => item.usuarioId === user.id) ?? null) : null),
    [db, user],
  );

  const guard = useCallback(<T,>(run: () => Promise<T>) => run(), []);

  const api = useMemo<GastroApi>(
    () => ({
      booted,
      mode,
      db,
      user,
      restaurant,
      influencer,
      enterDemo: (id) => guard(async () => adopt(await authRef.current!.loginDemo(id))),
      login: (email, password) => guard(async () => adopt(await authRef.current!.login(email, password))),
      registerRestaurant: (input) => guard(async () => adopt(await authRef.current!.registerRestaurant(input))),
      registerCreator: (input) => guard(async () => adopt(await authRef.current!.registerCreator(input))),
      registerAdmin: (input) => guard(async () => adopt(await authRef.current!.registerAdmin(input))),
      logout: () => {
        repoRef.current?.setAuth(null);
        clearSession();
        setUserId(null);
      },
      resetDemo: async () => {
        await repoRef.current!.resetDemo();
        clearSession();
        repoRef.current?.setAuth(null);
        setUserId(null);
        await refresh();
      },
      saveOffer: async (input, existingId) => {
        if (!restaurant) throw new GastroError("Entre como restaurante para publicar.");
        await offersRef.current!.saveOffer(restaurant, input, existingId);
        await refresh();
      },
      pauseOffer: async (id, paused) => {
        if (!restaurant) throw new GastroError("Entre como restaurante para pausar.");
        await offersRef.current!.setPaused(restaurant, id, paused);
        await refresh();
      },
      deleteOffer: async (id) => {
        if (!restaurant) throw new GastroError("Entre como restaurante para excluir.");
        await offersRef.current!.deleteOffer(restaurant, id);
        await refresh();
      },
      expressInterest: async (offerId, message) => {
        if (!influencer) throw new GastroError("Entre como criador para demonstrar interesse.");
        const link = await offersRef.current!.expressInterest(influencer, offerId, message);
        await refresh();
        return link.url;
      },
      reportOffer: async (offerId, motivo) => {
        if (!user) throw new GastroError("Entre para denunciar.");
        await offersRef.current!.reportOffer(user, offerId, motivo);
        await refresh();
      },
      toggleFavorite: async (offerId) => {
        if (!influencer) throw new GastroError("Favoritos são do perfil de criador.");
        await offersRef.current!.toggleFavorite(influencer, offerId);
        await refresh();
      },
      moderate: async (reportId, decision) => {
        if (!user) throw new GastroError("Entre como curadoria.");
        await offersRef.current!.moderate(user, reportId, decision);
        await refresh();
      },
    }),
    [adopt, booted, db, guard, influencer, mode, refresh, restaurant, user],
  );

  return <GastroContext.Provider value={api}>{children}</GastroContext.Provider>;
}

export function useGastro() {
  const value = useContext(GastroContext);
  if (!value) throw new Error("useGastro precisa estar dentro do GastroProvider.");
  return value;
}
