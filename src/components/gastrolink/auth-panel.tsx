import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CATEGORIES, type Cuisine, type ProfileType, type RegisterAdminInput, type RegisterCreatorInput, type RegisterRestaurantInput } from "@/domain/types";
import { Button, controlClass, Field, Logo } from "@/components/gastrolink/ui";
import { useGastro } from "@/state/gastro-context";

export function AuthPanel({ role, onBack }: { role: ProfileType; onBack: () => void }) {
  const { login, registerRestaurant, registerCreator, registerAdmin } = useGastro();
  const [mode, setMode] = useState<"login" | "register">(role === "ADMIN" ? "login" : "register");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const title =
    role === "RESTAURANTE" ? "Área do restaurante" : role === "INFLUENCIADOR" ? "Área do criador" : "Curadoria";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const senha = String(form.get("senha") ?? "");
    setPending(true);
    setError("");
    try {
      if (mode === "login") {
        await login(email, senha);
        toast.success("Sessão iniciada.");
        return;
      }
      if (role === "RESTAURANTE") {
        const input: RegisterRestaurantInput = {
          nomeCompleto: String(form.get("nome") ?? ""),
          email,
          senha,
          nomeFantasia: String(form.get("fantasia") ?? ""),
          documento: String(form.get("documento") ?? ""),
          whatsapp: String(form.get("whatsapp") ?? ""),
          culinaria: String(form.get("culinaria") ?? "Comida Caseira") as Cuisine,
          bairro: String(form.get("bairro") ?? ""),
        };
        await registerRestaurant(input);
      } else if (role === "INFLUENCIADOR") {
        const input: RegisterCreatorInput = {
          nomeCompleto: String(form.get("nome") ?? ""),
          email,
          senha,
          handle: String(form.get("handle") ?? ""),
          redeSocial: String(form.get("rede") ?? "Instagram"),
          seguidores: Number(form.get("seguidores") ?? 0),
          nicho: String(form.get("nicho") ?? ""),
          mediaKitUrl: String(form.get("midia") ?? ""),
        };
        await registerCreator(input);
      } else {
        const input: RegisterAdminInput = {
          nomeCompleto: String(form.get("nome") ?? ""),
          email,
          senha,
          chave: String(form.get("chave") ?? ""),
        };
        await registerAdmin(input);
      }
      toast.success("Conta criada. Você já está no mural.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível continuar.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto w-full max-w-lg px-4 py-4">
        <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="size-4" />
          Voltar
        </button>
        <div className="mt-4">
          <Logo />
        </div>
        <h1 className="mt-6 font-display text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "login" ? "Use o e-mail e a senha da sua conta." : "Cadastro curto, sem burocracia."}
        </p>
        {role !== "ADMIN" ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant={mode === "login" ? "ink" : "line"} onClick={() => setMode("login")}>
              Entrar
            </Button>
            <Button variant={mode === "register" ? "ink" : "line"} onClick={() => setMode("register")}>
              Criar conta
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant={mode === "login" ? "ink" : "line"} onClick={() => setMode("login")}>
              Entrar
            </Button>
            <Button variant={mode === "register" ? "ink" : "line"} onClick={() => setMode("register")}>
              Primeiro acesso
            </Button>
          </div>
        )}
        <form onSubmit={submit} className="mt-5 grid gap-3">
          {mode === "register" ? (
            <Field label="Nome completo">
              <input name="nome" required autoComplete="name" className={controlClass} />
            </Field>
          ) : null}
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" className={controlClass} />
          </Field>
          <Field label="Senha">
            <input name="senha" type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} className={controlClass} />
          </Field>
          {mode === "register" && role === "RESTAURANTE" ? (
            <>
              <Field label="Nome do restaurante">
                <input name="fantasia" required className={controlClass} />
              </Field>
              <Field label="CNPJ ou CPF" hint="Opcional no MVP.">
                <input name="documento" className={controlClass} />
              </Field>
              <Field label="WhatsApp com DDD">
                <input name="whatsapp" required inputMode="tel" placeholder="83999999999" className={controlClass} />
              </Field>
              <Field label="Bairro">
                <input name="bairro" required className={controlClass} />
              </Field>
              <Field label="Categoria culinária">
                <select name="culinaria" className={controlClass} defaultValue="Comida Caseira">
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
          {mode === "register" && role === "INFLUENCIADOR" ? (
            <>
              <Field label="@ do perfil">
                <input name="handle" required placeholder="@seuperfil" className={controlClass} />
              </Field>
              <Field label="Seguidores">
                <input name="seguidores" type="number" min={0} required defaultValue={1000} className={controlClass} />
              </Field>
              <Field label="Rede principal">
                <select name="rede" className={controlClass} defaultValue="Instagram">
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                </select>
              </Field>
              <Field label="Nicho">
                <input name="nicho" placeholder="Reviews de comida local" className={controlClass} />
              </Field>
              <Field label="Link do mídia kit" hint="Opcional.">
                <input name="midia" type="url" className={controlClass} />
              </Field>
            </>
          ) : null}
          {mode === "register" && role === "ADMIN" ? (
            <Field label="Chave da curadoria" hint="Na demonstração, a chave é GRUPO17.">
              <input name="chave" required className={controlClass} />
            </Field>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm font-medium text-heat">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="mt-2 w-full" disabled={pending}>
            {pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar e entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
