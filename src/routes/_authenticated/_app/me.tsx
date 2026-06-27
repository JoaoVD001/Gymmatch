import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Settings, LogOut, Pause, Trash2, Crown, Shield,
  Camera, Play, X, Gem, Info, PencilLine,
  ImageIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/me")({ component: Me });

type Plan = "free" | "gold" | "diamond" | "premium";
type Full = {
  name: string | null; age: number | null; bio: string | null; photo_url: string | null;
  goal: string | null; training_level: string | null; modalities: string[]; interests: string[];
  available_hours: string[]; plan: Plan; status: string;
};

const GOAL_LABELS: Record<string, string> = {
  friends: "Amizade", training_partner: "Parceiro de treino", romance: "Romance",
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado",
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
  }

  async function uploadExtraPhoto(file: File) {
    if (!user) return;
    if (photos.length >= 6) { toast.error("Máximo de 6 fotos"); return; }
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
    } catch (e) {
      toast.error((e as Error)?.message ?? "Erro ao enviar");
    } finally { setPhotoUploading(false); }
  }

  async function deleteExtraPhoto(id: string, url: string) {
    if (!user) return;
    const marker = "/avatars/";
    const idx = url.indexOf(marker);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("user_photos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (idx !== -1) await supabase.storage.from("avatars").remove([decodeURIComponent(url.slice(idx + marker.length))]);
    setPhotos((prev) => prev.filter((ph) => ph.id !== id));
  }

  function openSourcePicker(slot: "main" | "extra") {
    setPendingSlot(slot);
    setSourcePickerOpen(true);
  }

  function handleFileInput(source: "gallery" | "camera") {
    setSourcePickerOpen(false);
    setTimeout(() => { if (source === "camera") cameraRef.current?.click(); else galleryRef.current?.click(); }, 150);
  }

  function onFileSelected(file: File) {
    if (pendingSlot === "main") uploadMainPhoto(file); else uploadExtraPhoto(file);
    setPendingSlot(null);
  }

  if (loading) return <div className="grid min-h-screen place-items-center" style={{ background: "radial-gradient(ellipse at 50% 30%, oklch(0.20 0.012 280) 0%, oklch(0.13 0.01 280) 55%, oklch(0.09 0.008 280) 100%)" }}><span className="text-white/40 text-sm">Carregando...</span></div>;

  if (!p) return (
    <div className="grid min-h-screen place-items-center px-6 text-center" style={{ background: "radial-gradient(ellipse at 50% 30%, oklch(0.20 0.012 280) 0%, oklch(0.13 0.01 280) 55%, oklch(0.09 0.008 280) 100%)" }}>
      <div className="space-y-4">
        <p className="text-white/40">Não foi possível carregar o perfil.</p>
        <button onClick={signOut} className="rounded-2xl border border-white/10 bg-white/8 px-6 py-2.5 text-sm font-medium text-white">Sair</button>
      </div>
    </div>
  );

  const isPaused = p.status === "paused";
  const subtitle = [
    p.training_level ? LEVEL_LABELS[p.training_level] : null,
    p.goal ? GOAL_LABELS[p.goal] : null,
  ].filter(Boolean).join(" · ");

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: "radial-gradient(ellipse at 50% 30%, oklch(0.20 0.012 280) 0%, oklch(0.13 0.01 280) 55%, oklch(0.09 0.008 280) 100%)" }}
    >
      {/* ── Hidden inputs ── */}
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) onFileSelected(e.target.files[0]); e.target.value = ""; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { if (e.target.files?.[0]) onFileSelected(e.target.files[0]); e.target.value = ""; }} />

      {/* ══════════════════════════════════════
          HEADER BAR
      ══════════════════════════════════════ */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        {isAdmin ? (
          <Link to="/admin" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70" style={{ background: "rgba(0,0,0,0.35)" }}>
            <Shield className="h-4 w-4" />
          </Link>
        ) : <div className="h-10 w-10" />}

        <button onClick={() => setSettingsOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70" style={{ background: "rgba(0,0,0,0.35)" }}>
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* ══════════════════════════════════════
          PROFILE CARD
      ══════════════════════════════════════ */}
      <div className="mx-4 rounded-[24px] overflow-hidden" style={{ background: "oklch(0.17 0.012 280 / 0.9)", border: "1px solid oklch(0.25 0.015 280 / 0.5)", backdropFilter: "blur(12px)" }}>
        <div className="p-5">

          {/* Avatar + Info */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <button
                onClick={() => openSourcePicker("main")}
                className="block h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/15 shadow-xl"
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                {p.photo_url
                  ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                  : <div className="grid h-full w-full place-items-center"><Camera className="h-7 w-7 text-white/30" /></div>
                }
                {uploading && <div className="absolute inset-0 rounded-full bg-black/60 grid place-items-center"><span className="text-[10px] text-white animate-pulse">...</span></div>}
              </button>
              <button
                onClick={() => openSourcePicker("main")}
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-xl border border-white/10 shadow-lg"
                style={{ background: "oklch(0.13 0.05 22 / 0.95)" }}
              >
                <PencilLine className="h-3.5 w-3.5 text-white/70" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[22px] font-bold text-white leading-tight truncate">
                {p.name ?? "—"}{p.age ? `, ${p.age}` : ""}
              </p>
              {subtitle && <p className="text-sm mt-0.5 truncate" style={{ color: "#9e7a8a" }}>{subtitle}</p>}
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

          {/* Action row */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/profile/edit"
              className="flex flex-1 items-center justify-center rounded-[14px] py-3 text-[15px] font-semibold text-white active:scale-[0.97] transition-all bg-primary shadow-glow"
            >
              Editar perfil
            </Link>
            <Link
              to="/premium"
              className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border active:scale-95 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.35)" }}
            >
              <Crown className="h-4.5 w-4.5 text-amber-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB BAR
      ══════════════════════════════════════ */}
      <div className="mx-4 mt-4 flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab("galeria")}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
            style={tab === "galeria" ? { background: "#ffffff", color: "#0f0008" } : { color: "rgba(255,255,255,0.45)" }}
          >
            Galeria
          </button>
          <button
            onClick={() => setTab("info")}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
            style={tab === "info" ? { background: "#ffffff", color: "#0f0008" } : { color: "rgba(255,255,255,0.45)" }}
          >
            Info
          </button>
        </div>

      </div>

      {/* ══════════════════════════════════════
          CONTEÚDO
      ══════════════════════════════════════ */}
      <div className="mt-3 px-4">

        {/* ── Galeria ── */}
        {tab === "galeria" && (
          <div className="space-y-1.5">
            {/* Contador */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-white/30">Fotos</span>
              <span className="text-xs font-medium text-white/30">{photos.length}/6</span>
            </div>

            {/* Linha 1: foto grande + 2 empilhadas */}
            <div className="grid grid-cols-2 gap-1.5" style={{ gridTemplateRows: "1fr 1fr" }}>
              {/* Slot 1 — grande */}
              {photos[0] ? (
                <div className="relative row-span-2 overflow-hidden rounded-xl" style={{ minHeight: "260px" }}>
                  <img src={photos[0].url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => deleteExtraPhoto(photos[0].id, photos[0].url)} className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full text-white transition-all active:scale-90" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button onClick={() => openSourcePicker("extra")} className="row-span-2 flex items-center justify-center rounded-xl" style={{ minHeight: "260px", background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.12)" }}>
                  <span className="text-3xl font-light" style={{ color: "rgba(255,255,255,0.2)" }}>+</span>
                </button>
              )}

              {/* Slot 2 */}
              {photos[1] ? (
                <div className="relative overflow-hidden rounded-xl aspect-square">
                  <img src={photos[1].url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => deleteExtraPhoto(photos[1].id, photos[1].url)} className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full text-white transition-all active:scale-90" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button onClick={() => openSourcePicker("extra")} className="flex items-center justify-center rounded-xl aspect-square" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.12)" }}>
                  <span className="text-2xl font-light" style={{ color: "rgba(255,255,255,0.2)" }}>+</span>
                </button>
              )}

              {/* Slot 3 */}
              {photos[2] ? (
                <div className="relative overflow-hidden rounded-xl aspect-square">
                  <img src={photos[2].url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => deleteExtraPhoto(photos[2].id, photos[2].url)} className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full text-white transition-all active:scale-90" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button onClick={() => openSourcePicker("extra")} className="flex items-center justify-center rounded-xl aspect-square" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.12)" }}>
                  <span className="text-2xl font-light" style={{ color: "rgba(255,255,255,0.2)" }}>+</span>
                </button>
              )}
            </div>

            {/* Linha 2: slots 4, 5, 6 */}
            <div className="grid grid-cols-3 gap-1.5">
              {[3, 4, 5].map((idx) => (
                photos[idx] ? (
                  <div key={photos[idx].id} className="relative overflow-hidden rounded-xl aspect-square">
                    <img src={photos[idx].url} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => deleteExtraPhoto(photos[idx].id, photos[idx].url)} className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full text-white transition-all active:scale-90" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button key={idx} onClick={() => openSourcePicker("extra")} className="flex items-center justify-center rounded-xl aspect-square" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.12)" }}>
                    <span className="text-xl font-light" style={{ color: "rgba(255,255,255,0.2)" }}>+</span>
                  </button>
                )
              ))}
            </div>
          </div>
        )}

        {/* ── Info ── */}
        {tab === "info" && (
          <div className="space-y-5">
            {p.bio && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9e7a8a" }}>Sobre</p>
                <p className="text-sm leading-relaxed text-white/70">{p.bio}</p>
              </div>
            )}
            {p.modalities?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9e7a8a" }}>Modalidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.modalities.map((m) => (
                    <span key={m} className="rounded-full px-3 py-1 text-xs text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>{m}</span>
                  ))}
                </div>
              </div>
            )}
            {p.interests?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9e7a8a" }}>Interesses</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.interests.map((tag) => (
                    <span key={tag} className="rounded-full px-3 py-1 text-xs text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {p.available_hours?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9e7a8a" }}>Horários</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.available_hours.map((h) => (
                    <span key={h} className="rounded-full px-3 py-1 text-xs text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>{h}</span>
                  ))}
                </div>
              </div>
            )}
            {!p.bio && !p.modalities?.length && !p.interests?.length && (
              <Link
                to="/profile/edit"
                className="flex flex-col items-center justify-center gap-3 rounded-2xl py-14"
                style={{ background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.1)" }}
              >
                <Info className="h-6 w-6 text-white/20" />
                <span className="text-sm font-medium text-white/25">Complete seu perfil</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          SOURCE PICKER
      ══════════════════════════════════════ */}
      {sourcePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-md" onClick={() => setSourcePickerOpen(false)}>
          <div className="w-full rounded-t-[32px] px-4 pt-3 pb-10" style={{ background: "linear-gradient(to bottom, oklch(0.20 0.012 280), oklch(0.13 0.01 280))", border: "1px solid oklch(0.25 0.015 280 / 0.5)", borderBottom: "none" }} onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />

            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Adicionar foto</p>

            {/* Options */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => handleFileInput("camera")}
                className="flex flex-1 flex-col items-center gap-3 rounded-2xl py-5 transition-all active:scale-[0.97]"
                style={{ background: "oklch(0.22 0.012 280)", border: "1px solid oklch(0.25 0.015 280 / 0.6)" }}
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">Câmera</span>
              </button>

              <button
                onClick={() => handleFileInput("gallery")}
                className="flex flex-1 flex-col items-center gap-3 rounded-2xl py-5 transition-all active:scale-[0.97]"
                style={{ background: "oklch(0.22 0.012 280)", border: "1px solid oklch(0.25 0.015 280 / 0.6)" }}
              >
                <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "oklch(0.28 0.012 280)" }}>
                  <ImageIcon className="h-5 w-5 text-white/60" />
                </div>
                <span className="text-sm font-semibold text-white">Galeria</span>
              </button>
            </div>

            <button
              onClick={() => setSourcePickerOpen(false)}
              className="w-full rounded-2xl py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98]"
              style={{ background: "oklch(0.22 0.012 280)", color: "rgba(255,255,255,0.5)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SETTINGS SHEET
      ══════════════════════════════════════ */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
          <div className="w-full rounded-t-3xl p-2 pb-10" style={{ background: "linear-gradient(to bottom, oklch(0.20 0.012 280), oklch(0.13 0.01 280))", border: "1px solid oklch(0.25 0.015 280 / 0.5)" }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            <p className="px-5 pb-2 text-[13px] font-semibold text-white/40">Configurações</p>
            <button onClick={() => { setSettingsOpen(false); setStatus(isPaused ? "active" : "paused"); }} className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/5 transition-colors">
              {isPaused ? <Play className="h-5 w-5 text-green-400" /> : <Pause className="h-5 w-5 text-white/40" />}
              {isPaused ? "Reativar conta" : "Pausar conta"}
            </button>
            <button onClick={() => { setSettingsOpen(false); signOut(); }} className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/5 transition-colors">
              <LogOut className="h-5 w-5 text-white/40" /> Sair
            </button>
            <div className="my-2 mx-5 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <button onClick={() => { if (confirm("Excluir conta?")) setStatus("deleted"); }} className="flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-[15px] font-medium text-red-400 hover:bg-red-400/8 transition-colors">
              <Trash2 className="h-5 w-5" /> Excluir conta
            </button>
            <button onClick={() => setSettingsOpen(false)} className="mt-2 flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white/50" style={{ background: "rgba(255,255,255,0.05)" }}>
              <X className="h-4 w-4 mr-2" /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
