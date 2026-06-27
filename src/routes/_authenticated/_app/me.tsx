import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Settings, LogOut, Pause, Trash2, Crown, Shield, Plus, Camera, Play, X } from "lucide-react";

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
      💎 Diamond
    </span>
  );
  if (plan === "gold") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-black shadow">
      👑 Gold
    </span>
  );
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      Grátis
    </span>
  );
}

function Me() {
  const { user, isAdmin, signOut, refreshProfile } = useAuth();
  const [p, setP] = useState<Full | null>(null);
  const [photos, setPhotos] = useState<Array<{ id: string; url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
        <button onClick={signOut} className="rounded-2xl bg-card border border-border px-6 py-2.5 text-sm font-medium">
          Sair
        </button>
      </div>
    </div>
  );

  const isPaused = p.status === "paused";

  return (
    <div>
      {/* Header com gradiente + botões */}
      <div className="relative h-28 bg-gradient-to-br from-primary/30 via-primary/10 to-background overflow-hidden">
        <button
          onClick={() => setSettingsOpen(true)}
          className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur text-foreground"
          aria-label="Configurações"
        >
          <Settings className="h-4 w-4" />
        </button>
        {isAdmin && (
          <Link
            to="/admin"
            className="absolute top-4 left-4 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur text-blue-400"
            aria-label="Admin"
          >
            <Shield className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="px-5">
        {/* Avatar circular — separado da galeria */}
        <div className="flex items-end justify-between -mt-14 mb-3">
          <Link to="/profile/edit" className="relative group">
            <div className="h-28 w-28 rounded-full overflow-hidden bg-muted ring-4 ring-background shadow-lg">
              {p.photo_url
                ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/20 to-muted">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
              }
            </div>
            <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow ring-2 ring-background opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </Link>
          <PlanBadge plan={p.plan} />
        </div>

        {/* Nome + nível */}
        <h1 className="font-display text-2xl font-bold leading-tight mb-0.5">
          {p.name ?? "—"}{p.age ? `, ${p.age}` : ""}
        </h1>
        {(p.training_level || p.goal) && (
          <p className="text-sm text-muted-foreground mb-4">
            {p.training_level ? LEVEL_LABELS[p.training_level] : ""}
            {p.training_level && p.goal ? " · " : ""}
            {p.goal ? GOAL_LABELS[p.goal] : ""}
          </p>
        )}

        {/* Botões */}
        <div className="flex gap-2 mb-5">
          <Link
            to="/profile/edit"
            className="flex-1 rounded-xl border border-border bg-card py-2 text-center text-sm font-semibold hover:bg-accent transition-colors"
          >
            Editar perfil
          </Link>
          <Link
            to="/premium"
            className="flex-1 rounded-xl border border-border bg-card py-2 text-center text-sm font-semibold hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
          >
            <Crown className="h-3.5 w-3.5 text-amber-400" /> Premium
          </Link>
        </div>

        {/* Bio */}
        {p.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.bio}</p>
        )}

        {/* Modalidades */}
        {p.modalities?.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {p.modalities.slice(0, 5).map((m) => (
              <span key={m} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{m}</span>
            ))}
          </div>
        )}

        {/* Interesses */}
        {p.interests?.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {p.interests.map((tag) => (
              <span key={tag} className="rounded-full bg-accent px-3 py-1 text-xs">{tag}</span>
            ))}
          </div>
        )}

        {/* Galeria de fotos — separada da foto de perfil */}
        <div className="mb-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-muted-foreground">
              Galeria <span className="font-normal">({photos.length}/5)</span>
            </span>
            <Link
              to="/profile/edit"
              className="flex items-center gap-1 rounded-full bg-card border border-border/60 px-3 py-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Camera className="h-3 w-3" /> Gerenciar
            </Link>
          </div>

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
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 py-8 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Adicionar fotos à galeria</span>
            </Link>
          )}
        </div>
      </div>

      {/* Settings sheet */}
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
              {isPaused
                ? <Play className="h-5 w-5 text-green-400" />
                : <Pause className="h-5 w-5 text-muted-foreground" />
              }
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
              onClick={() => {
                if (confirm("Excluir conta? Seus dados serão mantidos por conformidade.")) setStatus("deleted");
              }}
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
