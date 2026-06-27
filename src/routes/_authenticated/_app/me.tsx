import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Settings, LogOut, Pause, Trash2, Crown, Shield,
  Camera, Play, X, Gem, Grid2x2, Info, PencilLine,
  Star, ImageIcon, Plus, Share2,
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
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; position: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"galeria" | "info">("galeria");

  const [uploading, setUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<"main" | "extra" | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);

  const nav = useNavigate();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles")
        .select("name,age,bio,photo_url,goal,training_level,modalities,interests,available_hours,plan,status")
        .eq("id", user.id).maybeSingle()
        .then(({ data }) => setP(data as Full | null)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("user_photos").select("id,url,position").eq("user_id", user.id).order("position")
        .then(({ data }: any) => setPhotos((data ?? []) as Array<{ id: string; url: string; position: number }>)),
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

  async function uploadMainPhoto(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error } = await supabase.from("profiles").update({ photo_url: urlData.publicUrl }).eq("id", user.id);
      if (error) throw error;
      setP((prev) => prev ? { ...prev, photo_url: urlData.publicUrl } : prev);
      await refreshProfile();
      toast.success("Foto atualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar foto");
    } finally { setUploading(false); }
  }

  async function removeMainPhoto() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ photo_url: null }).eq("id", user.id);
    if (error) return toast.error(error.message);
    setP((prev) => prev ? { ...prev, photo_url: null } : prev);
    await refreshProfile();
    toast.success("Foto removida");
  }

  async function uploadExtraPhoto(file: File) {
    if (!user) return;
    if (photos.length >= 5) { toast.error("Máximo de 5 fotos"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Máximo 10 MB"); return; }
    setPhotoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/photos/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false });
      if (upErr) { toast.error(upErr.message); return; }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const nextPos = photos.length > 0 ? Math.max(...photos.map((ph) => ph.position)) + 1 : 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error } = await (supabase.from as any)("user_photos")
        .insert({ user_id: user.id, url: urlData.publicUrl, position: nextPos })
        .select("id,url,position").single();
      if (error) { toast.error(error.message); return; }
      setPhotos((prev) => [...prev, inserted as { id: string; url: string; position: number }]);
      toast.success("Foto adicionada");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Erro ao enviar");
    } finally { setPhotoUploading(false); }
  }

  async function deleteExtraPhoto(id: string, url: string) {
    if (!user) return;
    const marker = "/avatars/";
    const markerIndex = url.indexOf(marker);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("user_photos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (markerIndex !== -1) {
      await supabase.storage.from("avatars").remove([decodeURIComponent(url.slice(markerIndex + marker.length))]);
    }
    setPhotos((prev) => prev.filter((ph) => ph.id !== id));
  }

  function openSourcePicker(slot: "main" | "extra") {
    setPendingSlot(slot);
    setSourcePickerOpen(true);
  }

  function handleFileInput(source: "gallery" | "camera") {
    setSourcePickerOpen(false);
    setTimeout(() => {
      if (source === "camera") cameraRef.current?.click();
      else galleryRef.current?.click();
    }, 150);
  }

  function onFileSelected(file: File) {
    if (pendingSlot === "main") uploadMainPhoto(file);
    else uploadExtraPhoto(file);
    setPendingSlot(null);
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-muted-foreground">Carregando...</div>;

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
  const totalPhotos = (p.photo_url ? 1 : 0) + photos.length;

  return (
    <div className="pb-28">

      {/* ── Hidden inputs ── */}
      <input ref={galleryRef} type="file" accept="image/*" hidden
        onChange={(e) => { if (e.target.files?.[0]) onFileSelected(e.target.files[0]); e.target.value = ""; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { if (e.target.files?.[0]) onFileSelected(e.target.files[0]); e.target.value = ""; }} />

      {/* ══════════════════════════════════════
          GRADIENT HEADER
      ══════════════════════════════════════ */}
      <div
        className="relative h-44"
        style={{ background: "linear-gradient(to bottom, oklch(0.68 0.21 22) 0%, oklch(0.22 0.07 22) 60%, oklch(0.12 0.02 22) 100%)" }}
      >
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-5">
          {isAdmin ? (
            <Link to="/admin" className="grid h-10 w-10 place-items-center rounded-full bg-black/30 backdrop-blur-sm text-white/90 border border-white/10">
              <Shield className="h-4 w-4" />
            </Link>
          ) : <div className="h-10 w-10" />}

          <button
            onClick={() => setSettingsOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/30 backdrop-blur-sm text-white/90 border border-white/10"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PROFILE CARD — overlaps header
      ══════════════════════════════════════ */}
      <div className="-mt-8 mx-3">
        <div className="rounded-3xl border border-white/6 bg-card/95 p-5 shadow-2xl backdrop-blur-sm">

          {/* Avatar + nome */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <button
                onClick={() => openSourcePicker("main")}
                className="block h-[76px] w-[76px] rounded-full overflow-hidden bg-muted ring-2 ring-white/10 shadow-lg"
              >
                {p.photo_url
                  ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                  : <div className="grid h-full w-full place-items-center bg-muted">
                      <Camera className="h-7 w-7 text-muted-foreground" />
                    </div>
                }
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 grid place-items-center">
                    <span className="text-[10px] text-white animate-pulse">...</span>
                  </div>
                )}
              </button>
              <Link
                to="/profile/edit"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-xl border border-border/50 bg-card shadow-md"
              >
                <PencilLine className="h-3.5 w-3.5 text-foreground/80" />
              </Link>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight truncate">
                {p.name ?? "—"}{p.age ? `, ${p.age}` : ""}
              </h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
              {p.plan === "diamond" && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  <Gem className="h-2.5 w-2.5" /> Diamond
                </span>
              )}
              {p.plan === "gold" && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-0.5 text-[11px] font-bold text-black">
                  <Crown className="h-2.5 w-2.5" /> Gold
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/profile/edit"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 py-2.5 text-sm font-semibold text-foreground active:scale-[0.97] transition-all"
            >
              <PencilLine className="h-3.5 w-3.5" /> Editar perfil
            </Link>
            <Link
              to="/premium"
              className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-400 active:scale-95 transition-all"
            >
              <Crown className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/6 text-muted-foreground active:scale-95 transition-all"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB BAR
      ══════════════════════════════════════ */}
      <div className="mt-4 mx-3 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-full bg-white/6 p-1 border border-white/8">
          {(["galeria", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "galeria" ? <Grid2x2 className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              {t === "galeria" ? "Galeria" : "Info"}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {totalPhotos}/6 fotos
        </span>
      </div>

      {/* ══════════════════════════════════════
          CONTEÚDO
      ══════════════════════════════════════ */}
      <div className="mt-3 px-3">

        {/* ── Galeria ── */}
        {tab === "galeria" && (
          <div>
            {/* Linha superior: foto principal + 2 extras */}
            <div className="flex gap-1.5 mb-1.5">
              <div className="relative rounded-2xl overflow-hidden bg-muted/60" style={{ flex: 2, aspectRatio: "4/5" }}>
                {p.photo_url ? (
                  <>
                    <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-semibold text-white">Principal</span>
                    </div>
                    <button onClick={() => openSourcePicker("main")}
                      className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/55 backdrop-blur-sm text-white">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={removeMainPhoto}
                      className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 backdrop-blur-sm text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button onClick={() => openSourcePicker("main")} disabled={uploading}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Foto principal</span>
                  </button>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                {[0, 1].map((idx) => {
                  const photo = photos[idx];
                  const isLoading = photoUploading && idx === photos.length;
                  return (
                    <div key={idx} className="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-muted/60">
                      {photo ? (
                        <>
                          <img src={photo.url} alt="" className="h-full w-full object-cover" />
                          <button onClick={() => deleteExtraPhoto(photo.id, photo.url)}
                            className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white">
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => p.photo_url && openSourcePicker("extra")}
                          disabled={isLoading || !p.photo_url}
                          className="flex h-full w-full items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-30">
                          {isLoading ? <span className="text-[10px] animate-pulse">…</span> : <Plus className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Linha inferior: 2 extras */}
            <div className="grid grid-cols-2 gap-1.5">
              {[2, 3].map((idx) => {
                const photo = photos[idx];
                const isLoading = photoUploading && idx === photos.length;
                return (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-muted/60">
                    {photo ? (
                      <>
                        <img src={photo.url} alt="" className="h-full w-full object-cover" />
                        <button onClick={() => deleteExtraPhoto(photo.id, photo.url)}
                          className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => p.photo_url && openSourcePicker("extra")}
                        disabled={isLoading || !p.photo_url}
                        className="flex h-full w-full items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-30">
                        {isLoading ? <span className="text-[10px] animate-pulse">…</span> : <Plus className="h-5 w-5" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {!p.photo_url && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Adicione a foto principal para aparecer no Descobrir.
              </p>
            )}
          </div>
        )}

        {/* ── Info ── */}
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
              <Link to="/profile/edit" className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 py-14 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                <Info className="h-6 w-6" />
                <span className="text-sm font-medium">Complete seu perfil</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          SOURCE PICKER
      ══════════════════════════════════════ */}
      {sourcePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setSourcePickerOpen(false)}>
          <div className="w-full rounded-t-3xl bg-card p-2 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <p className="px-5 pb-2 text-[13px] font-semibold text-muted-foreground">Adicionar foto</p>
            <button onClick={() => handleFileInput("camera")}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium hover:bg-accent transition-colors">
              <Camera className="h-5 w-5 text-muted-foreground" /> Câmera
            </button>
            <button onClick={() => handleFileInput("gallery")}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium hover:bg-accent transition-colors">
              <ImageIcon className="h-5 w-5 text-muted-foreground" /> Galeria
            </button>
            <button onClick={() => setSourcePickerOpen(false)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-[15px] font-semibold">
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SETTINGS SHEET
      ══════════════════════════════════════ */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
          <div className="w-full rounded-t-3xl bg-card p-2 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <p className="px-5 pb-2 text-[13px] font-semibold text-muted-foreground">Configurações</p>
            <button onClick={() => { setSettingsOpen(false); setStatus(isPaused ? "active" : "paused"); }}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium hover:bg-accent transition-colors">
              {isPaused ? <Play className="h-5 w-5 text-green-400" /> : <Pause className="h-5 w-5 text-muted-foreground" />}
              {isPaused ? "Reativar conta" : "Pausar conta"}
            </button>
            <button onClick={() => { setSettingsOpen(false); signOut(); }}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium hover:bg-accent transition-colors">
              <LogOut className="h-5 w-5 text-muted-foreground" /> Sair
            </button>
            <div className="my-2 mx-5 h-px bg-border/50" />
            <button onClick={() => { if (confirm("Excluir conta?")) setStatus("deleted"); }}
              className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-5 w-5" /> Excluir conta
            </button>
            <button onClick={() => setSettingsOpen(false)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-[15px] font-semibold">
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
