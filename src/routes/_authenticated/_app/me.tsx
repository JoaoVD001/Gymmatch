import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Settings, LogOut, Pause, Trash2, Crown, Shield, Plus, Camera, Play, X, Gem, Grid2x2, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/me")({ component: Me });

type Plan = "free" | "gold" | "diamond" | "premium";
type Full = {
  name: string | null; age: number | null; bio: string | null; photo_url: string | null;
  goal: string | null; training_level: string | null; modalities: string[]; interests: string[];
  available_hours: string[]; plan: Plan; status: string;
};

const GOAL_LABELS: Record<string, string> = {
  friends: "Amizade",
  training_partner: "Parceiro de treino",
  romance: "Romance",
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "diamond") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
      <Gem className="h-3 w-3" /> Diamond
    </span>
  );
  if (plan === "gold") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-black shadow">
      <Crown className="h-3 w-3" /> Gold
    </span>
  );
  return null;
}

function Me() {
  const { user, isAdmin, signOut, refreshProfile } = useAuth();
  const [p, setP] = useState<Full | null>(null);
  const [photos, setPhotos] = useState<Array<{ id: string; url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"galeria" | "info">("galeria");
  const nav = useNavigate();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles")
        .select("name,age,bio,photo_url,goal,training_level,modalities,interests,available_hours,plan,status")
        .eq("id", user.id).maybeSingle()
        .then(({ data }) => setP(data as Full | null)),
      supabase.from("user_photos").select("id,url,position").eq("user_id", user.id).order("position")
        .then(({ data }) => setPhotos((data ?? []) as Array<{ id: string; url: string }>)),
    ]).finally(() => setLoading(false));
  }, [user]);

  async function setStatus(status: "active" | "paused" | "deleted") {
    if (!user) return;
    setSettingsOpen(false);
    const { error } = await supabase.from("profiles").update({ status }).eq("id", user.id);
    if (error) return toast.error(error.message);
    await supabase.from("audit_logs").insert({ actor_id: user.id, action: `profile.${status}` });
    if (status === "deleted") { await signOut(); nav({ to: "/" }); }
    else { toast.success(status === "paused" ? "Conta pausada" : "Conta reativada"); refreshProfile(); }
  }

  if (loading) return (
    <div className="grid min-h-[60vh] place-items-center text-muted-foreground">Carregando...</div>
  );

  if (!p) return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div className="space-y-4">
        <p className="text-muted-foreground">Não foi possível carregar o perfil.</p>
        <button onClick={signOut} className="rounded-2xl bg-card border border-border px-6 py-2.5 text-sm font-medium">Sair</button>
      </div>
    </div>
  );

  const isPaused = p.status === "paused";
  const subtitle = [p.training_level ? LEVEL_LABELS[p.training_level] : null, p.goal ? GOAL_LABELS[p.goal] : null].filter(Boolean).join(" · ");

  return (
    <div className="pb-28">

      {/* ── Header rico ── */}
      <div className="relative h-60 overflow-hidden">
        {/* Glow radial do topo, some naturalmente sem faixa */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_140%_90%_at_50%_-5%,hsl(var(--primary)/0.65),transparent_70%)]" />

        {/* Botões topo */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-4">
          {isAdmin ? (
            <Link to="/admin" className="grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur text-blue-400">
              <Shield className="h-4 w-4" />
            </Link>
          ) : <div className="h-9 w-9" />}

          <button
            onClick={() => setSettingsOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur text-white"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar + nome no rodapé do header */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-5 flex items-end gap-4">
          <Link to="/profile/edit" className="relative shrink-0 group">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-muted ring-4 ring-background/40 shadow-xl">
              {p.photo_url
                ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/30 to-muted">
                    <Camera className="h-8 w-8 text-white/60" />
                  </div>
              }
            </div>
            <span className="absolute bottom-0.5 right-0.5 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </Link>

          <div className="pb-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-white leading-tight truncate">
              {p.name ?? "—"}{p.age ? `, ${p.age}` : ""}
            </h1>
            {subtitle && (
              <p className="text-sm text-white/65 mt-0.5 truncate">{subtitle}</p>
            )}
            {p.plan !== "free" && (
              <div className="mt-1.5">
                <PlanBadge plan={p.plan} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Botões de ação ── */}
      <div className="px-5 pt-4 pb-3 flex gap-2.5">
        <Link
          to="/profile/edit"
          className="flex-1 rounded-2xl bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground shadow active:scale-95 active:brightness-90 transition-all"
        >
          Editar perfil
        </Link>
        <Link
          to="/premium"
          className="flex items-center gap-1.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-400 active:scale-95 active:brightness-90 transition-all"
        >
          <Crown className="h-4 w-4" /> Premium
        </Link>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 pb-3 flex gap-2">
        <button
          onClick={() => setTab("galeria")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "galeria"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid2x2 className="h-3.5 w-3.5" /> Galeria
        </button>
        <button
          onClick={() => setTab("info")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "info"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Info className="h-3.5 w-3.5" /> Info
        </button>
      </div>

      {/* ── Conteúdo ── */}
      <div className="px-5">

        {/* Tab: Galeria */}
        {tab === "galeria" && (
          <div>
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {photos.length < 5 && (
                  <Link
                    to="/profile/edit"
                    className="aspect-square rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Adicionar</span>
                  </Link>
                )}
              </div>
            ) : (
              <Link
                to="/profile/edit"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 py-12 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Adicionar fotos à galeria</span>
              </Link>
            )}
          </div>
        )}

        {/* Tab: Info */}
        {tab === "info" && (
          <div className="space-y-5">
            {p.bio && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sobre</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{p.bio}</p>
              </div>
            )}

            {p.modalities?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Modalidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.modalities.map((m) => (
                    <span key={m} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {p.interests?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Interesses</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.interests.map((tag) => (
                    <span key={tag} className="rounded-full bg-accent px-3 py-1 text-xs">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {p.available_hours?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Horários</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.available_hours.map((h) => (
                    <span key={h} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{h}</span>
                  ))}
                </div>
              </div>
            )}

            {!p.bio && !p.modalities?.length && !p.interests?.length && (
              <Link
                to="/profile/edit"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 py-12 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Info className="h-6 w-6" />
                <span className="text-sm font-medium">Complete seu perfil</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Settings sheet ── */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-card p-2 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <p className="px-5 pb-2 text-[13px] font-semibold text-muted-foreground">Configurações</p>

            <button
              onClick={() => { setSettingsOpen(false); setStatus(isPaused ? "active" : "paused"); }}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium hover:bg-accent transition-colors"
            >
              {isPaused ? <Play className="h-5 w-5 text-green-400" /> : <Pause className="h-5 w-5 text-muted-foreground" />}
              {isPaused ? "Reativar conta" : "Pausar conta"}
            </button>

            <button
              onClick={() => { setSettingsOpen(false); signOut(); }}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium hover:bg-accent transition-colors"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
              Sair
            </button>

            <div className="my-2 mx-5 h-px bg-border/50" />

            <button
              onClick={() => { if (confirm("Excluir conta? Seus dados serão mantidos por conformidade.")) setStatus("deleted"); }}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              Excluir conta
            </button>

            <button
              onClick={() => setSettingsOpen(false)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-[15px] font-semibold transition-colors"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
