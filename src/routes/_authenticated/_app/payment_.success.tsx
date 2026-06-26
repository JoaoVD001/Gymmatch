import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, Crown, Sparkles, Loader2 } from "lucide-react";
import { activatePlanFromSession } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";

type Plan = "gold" | "diamond";

export const Route = createFileRoute("/_authenticated/_app/payment_/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: (s.session_id as string) ?? "",
    plan: (s.plan === "diamond" ? "diamond" : "gold") as Plan,
  }),
  component: PaymentSuccess,
});

function PaymentSuccess() {
  const { session_id, plan } = Route.useSearch();
  const { refreshProfile } = useAuth();
  const nav = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!session_id) { setStatus("error"); return; }
    activatePlanFromSession({ data: { sessionId: session_id } })
      .then(async () => {
        await refreshProfile();
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [session_id]);

  const isGold = plan === "gold";
  const Icon = isGold ? Crown : Sparkles;
  const color = isGold ? "text-amber-400" : "text-violet-400";
  const label = isGold ? "Gold" : "Diamond";

  if (status === "loading") return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Ativando seu plano...</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center space-y-4">
        <p className="text-lg font-semibold">Algo deu errado</p>
        <p className="text-sm text-muted-foreground">Seu pagamento foi processado, mas houve um erro ao ativar o plano. Entre em contato com o suporte.</p>
        <button onClick={() => nav({ to: "/discover" })} className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Ir para o app
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm">
        <div className="relative">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-green-500/10">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-card border border-border">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Bem-vindo ao {label}!</h1>
          <p className="text-muted-foreground text-sm">
            Sua assinatura foi ativada com sucesso. Aproveite todos os benefícios do plano {label}.
          </p>
        </div>

        <button
          onClick={() => nav({ to: "/discover" })}
          className="w-full rounded-2xl bg-gradient-primary py-4 font-semibold text-primary-foreground shadow-glow"
        >
          Começar a usar
        </button>

        <button
          onClick={() => nav({ to: "/premium" })}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Ver meu plano
        </button>
      </div>
    </div>
  );
}
