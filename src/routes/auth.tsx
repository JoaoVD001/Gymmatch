import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";
import { translateError } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: z.object({
    mode: z.enum(["signin", "signup"]).optional(),
  }),
});

function AuthPage() {
  const nav = useNavigate();
  const { mode: modeParam } = Route.useSearch();
  const { session, isAdmin, loading, profile } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">(modeParam ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      if (mode === "reset") return;
      if (isAdmin) nav({ to: "/admin" });
      else if (profile?.profile_complete) nav({ to: "/discover" });
      else nav({ to: "/onboarding" });
    }
  }, [loading, session, isAdmin, profile, nav, mode]);

  // Detecta token de recuperação de senha na URL
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");

      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Email enviado! Verifique sua caixa de entrada.");
        setMode("signin");

      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Senha atualizada com sucesso!");
        nav({ to: "/discover" });
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Algo deu errado";
      toast.error(translateError(raw));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-10 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold">GymMatch</span>
      </div>

      <h1 className="font-display text-3xl font-bold">
        {mode === "signup" && "Criar conta"}
        {mode === "signin" && "Bem-vindo de volta"}
        {mode === "forgot" && "Esqueceu a senha?"}
        {mode === "reset" && "Nova senha"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {mode === "signup" && "Cadastre-se para entrar na comunidade da sua academia."}
        {mode === "signin" && "Faça login para continuar dando match."}
        {mode === "forgot" && "Digite seu email e enviaremos um link para redefinir sua senha."}
        {mode === "reset" && "Digite sua nova senha para acessar sua conta."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode !== "reset" && (
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        {(mode === "signin" || mode === "signup") && (
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (mín. 8 caracteres)"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        {mode === "reset" && (
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha (mín. 8 caracteres)"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        <button
          disabled={busy}
          className="w-full rounded-2xl bg-gradient-primary py-3.5 font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {busy ? "Aguarde..." : (
            mode === "signup" ? "Criar conta" :
            mode === "signin" ? "Entrar" :
            mode === "forgot" ? "Enviar link" :
            "Salvar nova senha"
          )}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
        {mode === "signin" && (
          <>
            <button onClick={() => setMode("forgot")} className="block w-full hover:text-foreground">
              Esqueceu sua senha?
            </button>
            <button onClick={() => setMode("signup")} className="block w-full hover:text-foreground">
              Novo por aqui? Criar uma conta
            </button>
          </>
        )}
        {(mode === "signup" || mode === "forgot") && (
          <button onClick={() => setMode("signin")} className="hover:text-foreground">
            {mode === "signup" ? "Já tem uma conta? Faça login" : "Voltar ao login"}
          </button>
        )}
      </div>
    </div>
  );
}
