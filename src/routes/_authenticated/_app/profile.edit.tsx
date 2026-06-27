import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Camera, Lock, X, AlertTriangle, Check, Search, Plus, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/profile/edit")({ component: EditProfile });

const GENDERS = [
  { v: "male",       l: "Masculino" },
  { v: "female",     l: "Feminino" },
  { v: "non_binary", l: "Não-binário" },
  { v: "other",      l: "Prefiro não dizer" },
] as const;
const ORIENTATIONS = [
  { v: "heterosexual", l: "Heterossexual" },
  { v: "homosexual",   l: "Homossexual" },
  { v: "bisexual",     l: "Bissexual" },
  { v: "pansexual",    l: "Pansexual" },
  { v: "prefer_not",   l: "Prefiro não dizer" },
];
const LEVELS = [
  { v: "beginner",     l: "Iniciante" },
  { v: "intermediate", l: "Intermediário" },
  { v: "advanced",     l: "Avançado" },
] as const;
const MODALITIES = ["Musculação", "CrossFit", "Natação", "Pilates", "Corrida", "Yoga", "Artes Marciais", "Ciclismo", "Outro"];
const SPLITS    = ["ABC", "ABCD", "ABCDE", "Superior/Inferior", "Full Body", "Outro"];
const GOALS     = [
  { v: "training_partner", l: "Parceiro de treino" },
  { v: "friends",          l: "Amizade" },
  { v: "romance",          l: "Romance" },
] as const;
const HOURS = [
  { v: "morning",   l: "Manhã" },
  { v: "afternoon", l: "Tarde" },
  { v: "night",     l: "Noite" },
] as const;

type Form = {
  name: string; gender: string; sexual_orientation: string; hide_orientation: boolean;
  training_level: string; modalities: string[]; training_split: string;
  goal: string; available_hours: string[]; hide_hours: boolean;
  interests: string[]; photo_url: string | null; gym_ids: string[];
};
type Locked = { email: string | null; cpf: string | null; phone: string | null; age: number | null };
type Gym    = { id: string; name: string; address: string | null };

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function EditProfile() {
  const { user, refreshProfile } = useAuth();
  const nav = useNavigate();
  const fileRef        = useRef<HTMLInputElement>(null);
  const extraPhotoRef  = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>({
    name: "", gender: "", sexual_orientation: "", hide_orientation: false,
    training_level: "", modalities: [], training_split: "",
    goal: "", available_hours: [], hide_hours: false,
    interests: [], photo_url: null, gym_ids: [],
  });
  const [locked,       setLocked]       = useState<Locked>({ email: null, cpf: null, phone: null, age: null });
  const [interestInput, setInterestInput] = useState("");
  const [nameError,    setNameError]    = useState("");
  const [gymError,     setGymError]     = useState("");
  const [busy,          setBusy]          = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [photos,        setPhotos]        = useState<Array<{ id: string; url: string; position: number }>>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [allGyms,      setAllGyms]      = useState<Gym[]>([]);
  const [initialGymIds, setInitialGymIds] = useState<string[]>([]);
  const [gymSearch,    setGymSearch]    = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("name,gender,sexual_orientation,hide_orientation,training_level,modalities,training_split,goal,available_hours,hide_hours,interests,photo_url,email,cpf,phone,age")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          name: data.name ?? "",
          gender: data.gender ?? "",
          sexual_orientation: data.sexual_orientation ?? "",
          hide_orientation: !!data.hide_orientation,
          training_level: data.training_level ?? "",
          modalities: data.modalities ?? [],
          training_split: data.training_split ?? "",
          goal: data.goal ?? "",
          available_hours: data.available_hours ?? [],
          hide_hours: !!data.hide_hours,
          interests: data.interests ?? [],
          photo_url: data.photo_url,
        }));
        setLocked({ email: data.email, cpf: data.cpf, phone: data.phone, age: data.age });
      });
    supabase.from("gyms").select("id,name,address").eq("active", true).order("name")
      .then(({ data }) => setAllGyms((data ?? []) as Gym[]));
    supabase.from("user_photos").select("id,url,position").eq("user_id", user.id).order("position")
      .then(({ data }) => setPhotos((data ?? []) as Array<{ id: string; url: string; position: number }>));
    supabase.from("user_gyms").select("gym_id").eq("user_id", user.id)
      .then(({ data }) => {
        const ids = (data ?? []).map((r) => r.gym_id as string);
        setInitialGymIds(ids);
        setForm((f) => ({ ...f, gym_ids: ids }));
      });
  }, [user]);

  async function onFile(file: File) {
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
      setForm((f) => ({ ...f, photo_url: urlData.publicUrl }));
      toast.success("Foto atualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar foto");
    } finally { setUploading(false); }
  }

  async function removePhoto() {
    setSheet(false);
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ photo_url: null }).eq("id", user.id);
    if (error) return toast.error(error.message);
    setForm((f) => ({ ...f, photo_url: null }));
    toast.success("Foto removida");
  }

  async function uploadExtraPhoto(file: File) {
    if (!user) return;
    if (photos.length >= 5) { toast.error("Máximo de 5 fotos extras"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("A foto deve ter no máximo 10 MB"); return; }
    setPhotoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/photos/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false });
      if (upErr) { toast.error(upErr.message); return; }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const nextPos = photos.length > 0 ? Math.max(...photos.map((p) => p.position)) + 1 : 0;
      const { data: inserted, error } = await supabase
        .from("user_photos")
        .insert({ user_id: user.id, url: urlData.publicUrl, position: nextPos })
        .select("id,url,position")
        .single();
      if (error) { toast.error(error.message); return; }
      setPhotos((prev) => [...prev, inserted as { id: string; url: string; position: number }]);
      toast.success("Foto adicionada");
    } catch (e) {
      toast.error((e as any)?.message ?? "Falha ao enviar foto");
    } finally { setPhotoUploading(false); }
  }

  async function deleteExtraPhoto(id: string, url: string) {
    if (!user) return;
    const marker = "/avatars/";
    const markerIndex = url.indexOf(marker);
    const { error } = await supabase.from("user_photos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (markerIndex !== -1) {
      const bucketPath = decodeURIComponent(url.slice(markerIndex + marker.length));
      await supabase.storage.from("avatars").remove([bucketPath]);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Foto removida");
  }

  function addInterest() {
    const v = interestInput.trim();
    if (!v) return;
    if (form.interests.length >= 5) { toast.error("Máximo de 5 interesses"); return; }
    if (form.interests.includes(v)) return;
    setForm({ ...form, interests: [...form.interests, v] });
    setInterestInput("");
  }

  async function save() {
    if (!user) return;
    const name = form.name.trim();
    if (!name) { setNameError("Este campo é obrigatório"); return; }
    if (name.length > 60) { setNameError("Máximo de 60 caracteres"); return; }
    setNameError("");
    if (form.gym_ids.length === 0) { setGymError("Selecione pelo menos uma academia"); return; }
    setGymError("");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      name,
      gender: (form.gender || null) as "male" | "female" | "non_binary" | "other" | null,
      sexual_orientation: form.sexual_orientation || null,
      hide_orientation: form.hide_orientation,
      training_level: (form.training_level || null) as "beginner" | "intermediate" | "advanced" | null,
      modalities: form.modalities,
      training_split: form.training_split || null,
      goal: (form.goal || null) as "friends" | "training_partner" | "romance" | null,
      available_hours: form.available_hours as ("morning" | "afternoon" | "night")[],
      hide_hours: form.hide_hours,
      interests: form.interests,
      gym_id: form.gym_ids[0],
    }).eq("id", user.id);
    if (error) { setBusy(false); return toast.error(error.message); }

    const toAdd    = form.gym_ids.filter((id) => !initialGymIds.includes(id));
    const toRemove = initialGymIds.filter((id) => !form.gym_ids.includes(id));
    if (toRemove.length) await supabase.from("user_gyms").delete().eq("user_id", user.id).in("gym_id", toRemove);
    if (toAdd.length)    await supabase.from("user_gyms").insert(toAdd.map((gym_id) => ({ user_id: user.id, gym_id })));
    if (toAdd.length || toRemove.length) {
      const oldNames = allGyms.filter((g) => initialGymIds.includes(g.id)).map((g) => g.name);
      const newNames = allGyms.filter((g) => form.gym_ids.includes(g.id)).map((g) => g.name);
      await supabase.from("profile_history").insert({
        user_id: user.id, field_changed: "gym_units",
        old_value: JSON.stringify(oldNames), new_value: JSON.stringify(newNames),
      });
      setInitialGymIds(form.gym_ids);
    }

    setBusy(false);
    toast.success("Perfil atualizado!");
    await refreshProfile();
    nav({ to: "/me" });
  }

  const filteredGyms = allGyms.filter((g) => {
    const q = gymSearch.trim().toLowerCase();
    return !q || g.name.toLowerCase().includes(q) || (g.address ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => nav({ to: "/me" })} aria-label="Voltar" className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-base font-semibold tracking-tight">Editar perfil</h1>
        <button
          onClick={save} disabled={busy}
          className="rounded-full bg-gradient-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {busy ? "Salvando…" : "Salvar"}
        </button>
      </header>

      <div className="px-5 pt-6">
        {/* Grade de fotos unificada */}
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ""; }} />
        <input ref={extraPhotoRef} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files?.[0]) uploadExtraPhoto(e.target.files[0]); e.target.value = ""; }} />

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-muted-foreground">Fotos</h2>
          <span className="text-[12px] text-muted-foreground">{(form.photo_url ? 1 : 0) + photos.length}/6</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {/* Slot principal — ocupa 2 colunas e 2 linhas */}
          <div className="col-span-2 row-span-2 relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted/60 border border-border/40">
            {form.photo_url ? (
              <>
                <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
                {(uploading) && (
                  <div className="absolute inset-0 bg-black/50 grid place-items-center">
                    <span className="text-xs text-white animate-pulse">Enviando…</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-semibold text-white">Principal</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                  aria-label="Trocar foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-destructive/80 transition-colors"
                  aria-label="Remover foto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs animate-pulse">Enviando…</span>
                ) : (
                  <>
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Foto principal</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Slots extras (até 5) */}
          {Array.from({ length: 4 }).map((_, idx) => {
            const photo = photos[idx];
            const isLoading = photoUploading && idx === photos.length;
            return (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-muted/60 border border-border/40">
                {photo ? (
                  <>
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => deleteExtraPhoto(photo.id, photo.url)}
                      className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-destructive/80 transition-colors"
                      aria-label="Remover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => photos.length < 5 && extraPhotoRef.current?.click()}
                    disabled={isLoading || !form.photo_url}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
                  >
                    {isLoading ? (
                      <span className="text-[10px] animate-pulse">...</span>
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!form.photo_url && !uploading && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Adicione uma foto principal para aparecer no Descobrir.</p>
          </div>
        )}

        {/* Informações pessoais */}
        <Section title="Informações pessoais">
          <Field label="Nome" error={nameError}>
            <input className="ipt" maxLength={60} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Gênero">
            <select className="ipt" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Selecione</option>
              {GENDERS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </Field>
          <Field label="Orientação sexual">
            <select className="ipt" value={form.sexual_orientation} onChange={(e) => setForm({ ...form, sexual_orientation: e.target.value })}>
              <option value="">Selecione</option>
              {ORIENTATIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <Toggle
              checked={form.hide_orientation}
              onChange={(v) => setForm({ ...form, hide_orientation: v })}
              label="Ocultar do meu perfil"
            />
          </Field>
        </Section>

        {/* Treino */}
        <Section title="Treino">
          <Field label="Nível de treino">
            <select className="ipt" value={form.training_level} onChange={(e) => setForm({ ...form, training_level: e.target.value })}>
              <option value="">Selecione</option>
              {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
            </select>
          </Field>
          <Field label="Modalidades">
            <div className="flex flex-wrap gap-2">
              {MODALITIES.map((m) => (
                <Pill key={m} active={form.modalities.includes(m)} onClick={() => setForm({ ...form, modalities: toggle(form.modalities, m) })}>
                  {m}
                </Pill>
              ))}
            </div>
          </Field>
          <Field label="Divisão de treino">
            <select className="ipt" value={form.training_split} onChange={(e) => setForm({ ...form, training_split: e.target.value })}>
              <option value="">Selecione</option>
              {SPLITS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </Section>

        {/* Objetivos */}
        <Section title="Objetivos e disponibilidade">
          <Field label="Objetivo">
            <select className="ipt" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              <option value="">Selecione</option>
              {GOALS.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </Field>
          <Field label="Horários disponíveis">
            <div className="grid grid-cols-3 gap-2">
              {HOURS.map((h) => (
                <Pill key={h.v} active={form.available_hours.includes(h.v)} onClick={() => setForm({ ...form, available_hours: toggle(form.available_hours, h.v) })}>
                  {h.l}
                </Pill>
              ))}
            </div>
            <Toggle checked={form.hide_hours} onChange={(v) => setForm({ ...form, hide_hours: v })} label="Ocultar do meu perfil" />
          </Field>
          <Field label={`Interesses  ${form.interests.length}/5`}>
            <div className="flex gap-2">
              <input
                className="ipt flex-1"
                value={interestInput}
                placeholder="Ex: café, séries, caminhada…"
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
              />
              <button type="button" onClick={addInterest}
                className="shrink-0 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-accent transition-colors">
                +
              </button>
            </div>
            {form.interests.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {form.interests.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-accent/80 px-3 py-1 text-sm">
                    {tag}
                    <button type="button" onClick={() => setForm({ ...form, interests: form.interests.filter((t) => t !== tag) })} aria-label="Remover">
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </Section>

        {/* Academias */}
        <Section title="Minhas academias">
          <p className="-mt-1 mb-3 text-sm text-muted-foreground">
            Você verá perfis de todas as academias selecionadas.
          </p>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              className="ipt"
              style={{ paddingLeft: "2.5rem" }}
              placeholder="Buscar academia…"
              value={gymSearch}
              onChange={(e) => setGymSearch(e.target.value)}
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-2xl border border-border/60 bg-card divide-y divide-border/40">
            {filteredGyms.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma academia encontrada.</p>
            )}
            {filteredGyms.map((g) => {
              const checked = form.gym_ids.includes(g.id);
              return (
                <label key={g.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                  {/* Custom checkbox */}
                  <span className={`shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    checked
                      ? "border-primary bg-gradient-primary"
                      : "border-border bg-transparent"
                  }`}>
                    {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <input
                    type="checkbox" className="sr-only"
                    checked={checked}
                    onChange={() => setForm({ ...form, gym_ids: toggle(form.gym_ids, g.id) })}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{g.name}</div>
                    {g.address && <div className="truncate text-xs text-muted-foreground mt-0.5">{g.address}</div>}
                  </div>
                </label>
              );
            })}
          </div>
          {gymError && <p className="mt-1.5 text-xs text-destructive">{gymError}</p>}
        </Section>

        {/* Conta (readonly) */}
        <Section title="Informações da conta">
          <LockedField label="Email"    value={locked.email  ?? "—"} />
          <LockedField label="CPF"      value={locked.cpf    ?? "—"} />
          <LockedField label="Telefone" value={locked.phone  ?? "—"} />
          <LockedField label="Idade"    value={locked.age != null ? `${locked.age} anos` : "—"} />
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Estes campos não podem ser alterados após o cadastro. Em caso de erro, entre em contato com o suporte.
          </p>
        </Section>
      </div>

    </div>
  );
}

/* ---------- Sub-components ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-[13px] font-semibold text-muted-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground/90">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <span className="truncate">{value}</span>
        <Lock className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
        active
          ? "border-primary bg-gradient-primary text-white shadow-glow"
          : "border-border/70 bg-card text-foreground/80 hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? "bg-gradient-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
