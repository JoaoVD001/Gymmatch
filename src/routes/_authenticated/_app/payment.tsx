import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Crown, Sparkles, Loader2, ShieldCheck, RefreshCcw, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createCheckoutSession } from "@/lib/stripe";
import { toast } from "sonner";

type Plan = "gold" | "diamond";

export const Route = createFileRoute("/_authenticated/_app/payment")({
  validateSearch: (s: Record<string, unknown>) => {
    const plan = s.plan === "diamond" ? "diamond" : "gold";
    const price = Number(s.price) || (plan === "gold" ? 29.9 : 59.9);
    return { plan: plan as Plan, price };
  },
  component: PaymentScreen,
});

const PLAN_CONFIG = {
  gold: {
    label: "Gold",
    price: "R$ 29,90",
    icon: Crown,
    color: "#F5A623",
    bg: "from-amber-500/20 to-yellow-500/5",
    border: "border-amber-500/40",
    badge: "bg-amber-400/20 text-amber-500",
    benefits: [
      "Curtidas diárias ilimitadas",
      "Até 20 matches ativos",
      "Envio de imagens no chat",
      "Desfazer última curtida",
      "Ver os 5 últimos perfis que te curtiram",
    ],
  },
  diamond: {
    label: "Diamond",
    price: "R$ 59,90",
    icon: Sparkles,
    color: "#7C3AED",
    bg: "from-violet-500/20 to-blue-500/5",
    border: "border-violet-500/40",
    badge: "bg-violet-500/20 text-violet-400",
    benefits: [
      "Tudo do Gold",
      "Matches ilimitados",
      "Ver todos os perfis que te curtiram",
      "Boost semanal no topo da fila",
      "Filtros avançados de descoberta",
      'Badge exclusivo "Diamond" no perfil',
    ],
  },
} as const;

function PaymentScreen() {
  const { plan } = Route.useSearch();
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const config = PLAN_CONFIG[plan];
  const Icon = config.icon;

  async function handleCheckout() {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const result = await createCheckoutSession({
        data: {
          plan,
          userId: user.id,
          userEmail: user.email ?? "",
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/premium`,
        },
      });
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      toast.error("Não foi possível iniciar o pagamento. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <button onClick={() => nav({ to: "/premium" })} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">Finalizar assinatura</h1>
        <span className="w-5" />
      </header>

      <div className="px-5 pt-6 space-y-4">
        {/* Plan card */}
        <div className={`rounded-3xl border bg-gradient-to-br ${config.bg} ${config.border} p-5`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${config.color}20` }}>
              <Icon className="h-6 w-6" style={{ color: config.color }} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Plano {config.label}</h2>
              <p className="text-sm text-muted-foreground">{config.price}/mês · cobrado mensalmente</p>
            </div>
          </div>
          <ul className="space-y-2">
            {config.benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: config.color }} />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ backgroundColor: config.color }}
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Redirecionando...</>
          ) : (
            <>Assinar {config.label} — {config.price}/mês</>
          )}
        </button>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: ShieldCheck, label: "Pagamento seguro via Stripe" },
            { icon: RefreshCcw, label: "Cancele quando quiser" },
            { icon: Zap, label: "Ativação imediata" },
          ].map(({ icon: BadgeIcon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card/60 p-3 text-center">
              <BadgeIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2">
          Você será redirecionado para o checkout seguro do Stripe.<br />
          Aceitamos cartão de crédito, débito e Pix.
        </p>
      </div>
    </div>
  );
}
