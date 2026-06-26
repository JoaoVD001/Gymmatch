import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Check, Crown, Dumbbell, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/premium")({ component: Premium });

const PRICES = { gold: 29.9, diamond: 59.9 } as const;

const PLANS = [
  {
    key: "free",
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    icon: Dumbbell,
    color: "text-muted-foreground",
    benefits: [
      "Até 20 curtidas por dia",
      "Até 5 matches ativos",
      "Chat de texto com matches",
      "Descobrir perfis da sua academia",
      "Acesso à Lucia (IA)",
    ],
  },
  {
    key: "gold",
    name: "Gold",
    price: "R$ 29,90",
    period: "/mês",
    icon: Crown,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-yellow-500/5",
    border: "border-amber-500/30",
    highlight: true,
    benefits: [
      "Curtidas diárias ilimitadas",
      "Até 20 matches ativos",
      "Envio de imagens no chat",
      "Desfazer última curtida",
      "Ver até 5 perfis que te curtiram",
    ],
  },
  {
    key: "diamond",
    name: "Diamond",
    price: "R$ 59,90",
    period: "/mês",
    icon: Sparkles,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-500/5",
    border: "border-cyan-500/30",
    benefits: [
      "Tudo do Gold",
      "Matches ilimitados",
      "Ver todos os perfis que te curtiram",
      "Boost semanal no topo da fila",
      "Filtros avançados de descoberta",
      'Badge exclusivo "Diamond" no perfil',
      "Suporte prioritário",
    ],
  },
] as const;

function Premium() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const current = (profile?.plan ?? "free") as string;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/15 to-background px-6 pb-8 pt-6">
        <button
          onClick={() => nav({ to: "/me" })}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Premium</span>
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight">
          Encontre mais.<br />Conecte-se melhor.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Plano atual: <span className="font-semibold text-foreground">{labelOf(current)}</span>
        </p>
      </div>

      {/* Cards */}
      <div className="px-4 pb-8 space-y-3 -mt-2">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isActive = current === plan.key;
          const isFree = plan.key === "free";

          return (
            <div
              key={plan.key}
              className={`relative rounded-3xl border p-5 transition-all ${
                plan.highlight
                  ? `bg-gradient-to-br ${plan.gradient} ${plan.border}`
                  : plan.key === "gold"
                  ? `bg-gradient-to-br ${plan.gradient} ${plan.border}`
                  : "bg-card border-border/60"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 right-5">
                  <span className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    Mais popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl ${
                    plan.key === "diamond" ? "bg-cyan-500/20" :
                    plan.key === "gold" ? "bg-amber-500/20" :
                    "bg-muted"
                  }`}>
                    <Icon className={`h-5 w-5 ${plan.color}`} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold leading-none">{plan.name}</h2>
                    <div className="mt-0.5 flex items-baseline gap-0.5">
                      <span className="text-xl font-bold">{plan.price}</span>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                </div>
                {isActive && (
                  <span className="rounded-full bg-primary/20 border border-primary/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Ativo
                  </span>
                )}
              </div>

              {/* Benefits */}
              <ul className="space-y-2 mb-5">
                {plan.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm">
                    <div className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                      plan.key === "diamond" ? "bg-cyan-500/20" :
                      plan.key === "gold" ? "bg-amber-500/20" :
                      "bg-muted"
                    }`}>
                      <Check className={`h-2.5 w-2.5 ${plan.color}`} />
                    </div>
                    <span className="text-foreground/80">{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {!isFree && (
                <button
                  disabled={isActive}
                  onClick={() => nav({ to: "/payment", search: { plan: plan.key as "gold" | "diamond", price: PRICES[plan.key as "gold" | "diamond"] } })}
                  className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                    plan.key === "diamond"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                      : "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg"
                  }`}
                >
                  {isActive ? "Plano atual ✓" : `Assinar ${plan.name}`}
                </button>
              )}
              {isFree && isActive && (
                <div className="w-full rounded-2xl border border-border py-3.5 text-center text-sm font-semibold text-muted-foreground">
                  Plano atual ✓
                </div>
              )}
            </div>
          );
        })}

        <p className="text-center text-xs text-muted-foreground pt-2">
          Cancele quando quiser · Cobrado mensalmente via Stripe
        </p>
      </div>
    </div>
  );
}

function labelOf(p: string) {
  if (p === "gold") return "Gold";
  if (p === "diamond") return "Diamond";
  return "Grátis";
}
