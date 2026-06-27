import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Settings, LogOut, Pause, Trash2, Crown, Shield,
  Plus, Camera, Play, X, Gem, Grid2x2, Info, PencilLine,
} from "lucide-react";

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
  const subtitle = [
    p.training_level ? LEVEL_LABELS[p.training_level] : null,
    p.goal ? GOAL_LABELS[p.goal] : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="pb-28">

      {/* ══════════════════════════════════════
          HEADER — gradiente exato da referência
      ══════════════════════════════════════ */}
      <div
        className="relative h-64"
        style={{ background: "linear-gradient(to bottom, oklch(0.68 0.21 22) 0%, oklch(0.22 0.07 22) 55%, oklch(0.12 0.02 22) 100%)" }}
      >
        {/* Botões do topo */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-5">
          {isAdmin ? (
            <Link to="/admin" className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-sm text-white/80">
              <Shield className="h-4 w-4" />
            </Link>
          ) : <div className="h-9 w-9" />}

          <button
            onClick={() => setSettingsOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/25 backdrop-blur-sm text-white/80"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar + nome + editar — ancorados ao rodapé do header */}
        <div className="absolute bottom-0 inset-x-0 flex items-end justify-between px-5 pb-5">
          <div className="flex items-end gap-3.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-[82px] w-[82px] rounded-full overflow-hidden bg-black/30 ring-2 ring-white/20 shadow-xl">
                {p.photo_url
                  ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                  : <div className="grid h-full w-full place-items-center">
                      <Camera className="h-7 w-7 text-white/50" />
                    </div>
                }
              </div>
              {/* Badge de plano sobre o avatar */}
              {p.plan === "diamond" && (
                <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg ring-2 ring-black/40">
                  <Gem className="h-3 w-3 text-white" />
                </span>
              )}
              {p.plan === "gold" && (
                <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg ring-2 ring-black/40">
                  <Crown className="h-3 w-3 text-black" />
                </span>
              )}
            </div>

            {/* Nome + subtítulo */}
            <div className="pb-1 min-w-0">
              <h1 className="font-display text-[22px] font-bold text-white leading-tight">
                {p.name ?? "—"}{p.age ? `, ${p.age}` : ""}
              </h1>
              {subtitle && (
                <p className="text-sm text-white/55 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Botão editar perfil (ícone, canto direito) */}
          <Link
            to="/profile/edit"
            className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/25 backdrop-blur-sm text-white/80 hover:bg-black/40 transition-colors"
          >
            <PencilLine className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ÁREA DE AÇÕES
      ══════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        {/* Botão principal — Editar perfil */}
        <Link
          to="/profile/edit"
          className="flex-1 rounded-2xl bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground shadow-md active:scale-95 active:brightness-90 transition-all"
        >
          Editar perfil
        </Link>

        {/* Botão Premium */}
        <Link
          to="/premium"
          className="grid h-[42px] w-[42px] place-items-center rounded-2xl border border-amber-400/35 bg-amber-400/10 text-amber-400 active:scale-95 transition-all"
        >
          <Crown className="h-4.5 w-4.5" />
        </Link>
      </div>

      {/* ══════════════════════════════════════
          ABAS
      ══════════════════════════════════════ */}
      <div className="px-4 pb-3 pt-1 flex gap-1.5 border-b border-border/40">
        {(["galeria", "info"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "galeria" ? <Grid2x2 className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
            {t === "galeria" ? "Galeria" : "Info"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          CONTEÚDO
      ══════════════════════════════════════ */}
      <div className="px-4 pt-3">

        {/* Galeria */}
        {tab === "galeria" && (
          <div>
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {photos.length < 5 && (
                  <Link
                    to="/profile/edit"
                    className="aspect-square rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Adicionar</span>
                  </Link>
                )}
              </div>
            ) : (
              <Link
                to="/profile/edit"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 py-14 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Adicionar fotos à galeria</span>
              </Link>
            )}
          </div>
        )}

        {/* Info */}
        {tab === "info" && (
          <div className="space-y-5">
            {p.bio && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sobre</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{p.bio}</p>
              </div>
            )}
            {p.modalities?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Modalidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.modalities.map((m) => (
                    <span key={m} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {p.interests?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Interesses</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.interests.map((tag) => (
                    <span key={tag} className="rounded-full bg-accent px-3 py-1 text-xs">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {p.available_hours?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Horários</p>
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
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 py-14 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Info className="h-6 w-6" />
                <span className="text-sm font-medium">Complete seu perfil</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          SETTINGS SHEET
      ══════════════════════════════════════ */}
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-[15px] font-semibold"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
