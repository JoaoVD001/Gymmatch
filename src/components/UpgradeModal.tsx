import { useNavigate } from "@tanstack/react-router";
import { X, Zap, Crown, Gem, Heart, Undo2, Image, Users } from "lucide-react";

type Reason = "daily_limit" | "match_limit" | "undo" | "images";

const REASONS: Record<Reason, { icon: React.ReactNode; title: string; subtitle: string }> = {
  daily_limit: {
    icon: <Heart className="h-7 w-7 text-white" />,
    title: "Limite de curtidas atingido",
    subtitle: "Você usou todas as 20 curtidas do plano gratuito hoje.",
  },
  match_limit: {
    icon: <Users className="h-7 w-7 text-white" />,
    title: "Limite de matches atingido",
    subtitle: "Você atingiu o máximo de matches ativos do seu plano.",
  },
  undo: {
    icon: <Undo2 className="h-7 w-7 text-white" />,
    title: "Desfazer curtida",
    subtitle: "Desfazer é exclusivo para assinantes Gold e Diamond.",
  },
  images: {
    icon: <Image className="h-7 w-7 text-white" />,
    title: "Envio de fotos no chat",
    subtitle: "Compartilhe fotos no chat com Gold ou Diamond.",
  },
};

const PLANS = [
  {
    key: "gold",
    name: "Gold",
    price: "R$ 29,90",
    icon: <Crown className="h-5 w-5" />,
    color: "from-yellow-500 to-amber-400",
    textColor: "text-amber-400",
    borderColor: "border-amber-400/30",
    bgColor: "bg-amber-400/8",
    benefits: ["Curtidas ilimitadas", "Até 20 matches", "Desfazer curtida", "Fotos no chat"],
  },
  {
    key: "diamond",
    name: "Diamond",
    price: "R$ 59,90",
    icon: <Gem className="h-5 w-5" />,
    color: "from-cyan-400 to-blue-500",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-400/30",
    bgColor: "bg-cyan-400/8",
    benefits: ["Tudo do Gold", "Matches ilimitados", "Ver quem curtiu", "Filtros avançados"],
  },
];

type Props = {
  open: boolean;
  reason: Reason;
  onClose: () => void;
};

export function UpgradeModal({ open, reason, onClose }: Props) {
  const nav = useNavigate();

  if (!open) return null;

  const { icon, title, subtitle } = REASONS[reason];

  function goToPlan(plan: string) {
    onClose();
    const price = plan === "diamond" ? 59.9 : 29.9;
    nav({ to: "/payment", search: { plan: plan as "gold" | "diamond", price } });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-card border border-border/50 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com gradiente */}
        <div className="relative bg-gradient-to-br from-primary/80 via-primary/60 to-primary/30 px-6 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
            {icon}
          </div>
          <h2 className="font-display text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-white/70">{subtitle}</p>
        </div>

        {/* Planos */}
        <div className="p-4 space-y-3">
          <p className="text-center text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1">
            Escolha seu plano
          </p>

          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.key}
                onClick={() => goToPlan(plan.key)}
                className={`flex flex-col rounded-2xl border ${plan.borderColor} ${plan.bgColor} p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className={`mb-2 flex items-center gap-1.5 ${plan.textColor}`}>
                  {plan.icon}
                  <span className="text-sm font-bold">{plan.name}</span>
                </div>
                <div className="mb-3">
                  <span className="text-lg font-black text-foreground">{plan.price}</span>
                  <span className="text-[10px] text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Zap className={`h-3 w-3 shrink-0 ${plan.textColor}`} />
                      {b}
                    </li>
                  ))}
                </ul>
                <span className={`w-full rounded-xl bg-gradient-to-r ${plan.color} py-2 text-center text-xs font-bold text-white shadow-sm`}>
                  Assinar
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuar com o plano gratuito
          </button>
        </div>
      </div>
    </div>
  );
}
