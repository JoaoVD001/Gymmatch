import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Pencil, X, Check, Dumbbell, UserPlus, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/treino")({ component: Treino });

type Schedule = { mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string };
type Match    = { id: string; name: string; photo_url: string | null; gym: string | null };
type Invite   = {
  id: string; status: string; academy_name: string; scheduled_at: string;
  from_user: string;
  from_profile: { name: string; photo_url: string | null };
  to_profile:   { name: string; photo_url: string | null };
};

const WEEK_DAYS: { key: keyof Schedule; short: string; full: string }[] = [
  { key: "mon", short: "SEG", full: "Segunda" },
  { key: "tue", short: "TER", full: "Terça"   },
  { key: "wed", short: "QUA", full: "Quarta"  },
  { key: "thu", short: "QUI", full: "Quinta"  },
  { key: "fri", short: "SEX", full: "Sexta"   },
  { key: "sat", short: "SÁB", full: "Sábado"  },
  { key: "sun", short: "DOM", full: "Domingo" },
];
const TODAY_KEY = (["sun","mon","tue","wed","thu","fri","sat"] as (keyof Schedule)[])[new Date().getDay()];
const EMPTY: Schedule = { mon:"", tue:"", wed:"", thu:"", fri:"", sat:"", sun:"" };

function formatDT(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
       + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function callSendPush(user_id: string, title: string, body: string, url = "/treino") {
  const supaUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  await fetch(`${supaUrl}/functions/v1/send-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${anonKey}` },
    body: JSON.stringify({ user_id, title, body, url }),
  }).catch(() => null);
}

function Treino() {
  const { user } = useAuth();

  // plano semanal
  const [schedule, setSchedule]     = useState<Schedule>(EMPTY);
  const [loading, setLoading]       = useState(true);
  const [editingDay, setEditingDay] = useState<keyof Schedule | null>(null);
  const [dayDraft, setDayDraft]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // convites
  const [invites, setInvites]       = useState<Invite[]>([]);
  const [matches, setMatches]       = useState<Match[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invStep, setInvStep]       = useState<1 | 2>(1);
  const [selMatch, setSelMatch]     = useState<Match | null>(null);
  const [invDate, setInvDate]       = useState("");
  const [invTime, setInvTime]       = useState("");
  const [invAcademy, setInvAcademy] = useState("");
  const [sending, setSending]       = useState(false);
  const [showInvites, setShowInvites] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("workout_schedule").select("mon,tue,wed,thu,fri,sat,sun").eq("user_id", user.id).maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: any) => { if (data) setSchedule(data as Schedule); }),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("workout_invites")
        .select("id,status,academy_name,scheduled_at,from_user,from_profile:profiles!from_user(name,photo_url),to_profile:profiles!to_user(name,photo_url)")
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .order("scheduled_at", { ascending: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: any) => setInvites((data ?? []) as Invite[])),

      loadMatches(user.id),
    ]).finally(() => setLoading(false));
  }, [user]);

  async function loadMatches(uid: string) {
    const { data } = await supabase
      .from("matches")
      .select("user_a,user_b")
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .eq("active", true);
    if (!data?.length) return;
    const ids = (data as { user_a: string; user_b: string }[])
      .map((m) => m.user_a === uid ? m.user_b : m.user_a);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (supabase.from as any)("profiles")
      .select("id,name,photo_url,gym")
      .in("id", ids);
    setMatches((profiles ?? []) as Match[]);
  }

  /* ── Plano semanal ── */
  function startEdit(key: keyof Schedule) {
    setEditingDay(key);
    setDayDraft(schedule[key]);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function saveDay(key: keyof Schedule) {
    if (!user) return;
    const next = { ...schedule, [key]: dayDraft.trim() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("workout_schedule")
      .upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return; }
    setSchedule(next);
    setEditingDay(null);
  }

  /* ── Enviar convite ── */
  async function sendInvite() {
    if (!user || !selMatch || !invDate || !invTime || !invAcademy.trim()) return;
    setSending(true);
    const scheduled_at = new Date(`${invDate}T${invTime}`).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)("workout_invites")
      .insert({ from_user: user.id, to_user: selMatch.id, academy_name: invAcademy.trim(), scheduled_at })
      .select("id,status,academy_name,scheduled_at,from_user,from_profile:profiles!from_user(name,photo_url),to_profile:profiles!to_user(name,photo_url)")
      .single();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setInvites((prev) => [data as Invite, ...prev]);
    // notifica o destinatário
    await callSendPush(selMatch.id, "Convite de treino! 💪", `${user.email?.split("@")[0] ?? "Alguém"} te convidou para treinar em ${invAcademy.trim()}`);
    toast.success("Convite enviado!");
    setShowInviteModal(false);
    setInvStep(1); setSelMatch(null); setInvDate(""); setInvTime(""); setInvAcademy("");
  }

  /* ── Responder convite ── */
  async function respondInvite(id: string, status: "accepted" | "declined", invite: Invite) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("workout_invites").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setInvites((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    if (status === "accepted") {
      await callSendPush(invite.from_user, "Convite aceito! 🎉", `${invite.to_profile.name ?? "Seu match"} aceitou treinar com você em ${invite.academy_name}`);
      toast.success("Convite aceito!");
    } else {
      toast.success("Convite recusado");
    }
  }

  if (loading) return (
    <div className="grid min-h-screen place-items-center bg-background">
      <span className="text-muted-foreground text-sm">Carregando...</span>
    </div>
  );

  const pendingReceived = invites.filter((i) => i.status === "pending" && i.from_user !== user?.id);

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Dumbbell className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Meu Treino</h1>
              <p className="text-xs text-muted-foreground">Plano semanal</p>
            </div>
          </div>
          <button
            onClick={() => { setShowInviteModal(true); setInvStep(1); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white bg-gradient-primary shadow-glow active:scale-95 transition-all"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Convidar
            {pendingReceived.length > 0 && (
              <span className="ml-0.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-black text-primary">
                {pendingReceived.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* ── Convites pendentes recebidos ── */}
        {pendingReceived.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Convites recebidos</p>
            <div className="space-y-2">
              {pendingReceived.map((inv) => (
                <div key={inv.id} className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {inv.from_profile.photo_url
                      ? <img src={inv.from_profile.photo_url} className="h-8 w-8 rounded-full object-cover" alt="" />
                      : <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20"><Dumbbell className="h-4 w-4 text-primary" /></div>
                    }
                    <div>
                      <p className="text-sm font-semibold text-foreground">{inv.from_profile.name ?? "Alguém"} te convidou</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDT(inv.scheduled_at)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {inv.academy_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondInvite(inv.id, "accepted", inv)} className="flex-1 rounded-xl py-2 text-xs font-semibold text-white bg-gradient-primary shadow-glow active:scale-95 transition-all">
                      Aceitar
                    </button>
                    <button onClick={() => respondInvite(inv.id, "declined", inv)} className="flex-1 rounded-xl py-2 text-xs font-semibold text-muted-foreground border border-border active:scale-95 transition-all">
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Plano da Semana ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Plano da Semana</p>
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
            {WEEK_DAYS.map(({ key, short, full }) => {
              const isToday   = key === TODAY_KEY;
              const isEditing = editingDay === key;
              const value     = schedule[key];
              return (
                <div key={key} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${isToday ? "bg-primary/8" : ""}`}>
                  <div className="w-10 shrink-0 text-center">
                    <p className={`text-[11px] font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{short}</p>
                    {isToday && <div className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input ref={inputRef} value={dayDraft} onChange={(e) => setDayDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveDay(key); if (e.key === "Escape") setEditingDay(null); }}
                        placeholder={`Treino de ${full.toLowerCase()}...`}
                        className="w-full rounded-lg bg-muted/60 border border-primary/40 px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      />
                    ) : (
                      <p className={`text-sm truncate ${value ? "text-foreground" : "text-muted-foreground/40 italic"}`}>
                        {value || "Descanso"}
                      </p>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => saveDay(key)} className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary active:scale-90 transition-all"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditingDay(null)} className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted-foreground active:scale-90 transition-all"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(key)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"><Pencil className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Todos os convites ── */}
        {invites.length > 0 && (
          <div>
            <button className="flex w-full items-center justify-between px-1 mb-3" onClick={() => setShowInvites((v) => !v)}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Treinos marcados</p>
              {showInvites ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showInvites && (
              <div className="space-y-2">
                {invites.filter((i) => i.status !== "pending" || i.from_user === user?.id).map((inv) => {
                  const isMine = inv.from_user === user?.id;
                  const other  = isMine ? inv.to_profile : inv.from_profile;
                  const statusColor = inv.status === "accepted" ? "text-green-400" : inv.status === "declined" ? "text-destructive" : "text-muted-foreground";
                  const statusLabel = { pending: "Aguardando", accepted: "Confirmado ✓", declined: "Recusado", cancelled: "Cancelado" }[inv.status] ?? inv.status;
                  return (
                    <div key={inv.id} className="rounded-2xl border border-border/50 bg-card p-4">
                      <div className="flex items-center gap-3">
                        {other?.photo_url
                          ? <img src={other.photo_url} className="h-9 w-9 rounded-full object-cover" alt="" />
                          : <div className="grid h-9 w-9 place-items-center rounded-full bg-muted"><Dumbbell className="h-4 w-4 text-muted-foreground" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{other?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDT(inv.scheduled_at)}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{inv.academy_name}</p>
                        </div>
                        <span className={`text-[11px] font-semibold ${statusColor}`}>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL DE CONVITE ══ */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div
            className="w-full rounded-t-[36px] px-5 pt-3 pb-10 border-t border-x border-border/40"
            style={{ background: "linear-gradient(to bottom, oklch(0.17 0.012 280), oklch(0.13 0.01 280))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* pill */}
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/10" />

            {invStep === 1 && (
              <>
                {/* header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary shadow-glow shrink-0">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">Convidar para treinar</p>
                    <p className="text-xs text-muted-foreground">Escolha um dos seus matches</p>
                  </div>
                </div>

                {matches.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-muted/30">
                      <Dumbbell className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground/60">Você ainda não tem matches.</p>
                    <p className="text-xs text-muted-foreground/40">Dê swipe no Discover para conectar!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {matches.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setSelMatch(m); setInvStep(2); }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/8 p-3.5 text-left active:scale-[0.98] transition-all"
                      >
                        {m.photo_url
                          ? <img src={m.photo_url} className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/30" alt="" />
                          : <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/20 ring-2 ring-primary/20"><Dumbbell className="h-4 w-4 text-primary" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{m.name ?? "—"}</p>
                          {m.gym && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{m.gym}</p>}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {invStep === 2 && selMatch && (
              <>
                {/* header */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setInvStep(1)}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-muted-foreground active:scale-90 transition-all shrink-0"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                  {selMatch.photo_url
                    ? <img src={selMatch.photo_url} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30" alt="" />
                    : <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/20"><Dumbbell className="h-4 w-4 text-primary" /></div>
                  }
                  <div>
                    <p className="text-base font-bold text-foreground">Treino com {selMatch.name}</p>
                    <p className="text-xs text-muted-foreground">Defina data, hora e local</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Data</label>
                      <input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Horário</label>
                      <input type="time" value={invTime} onChange={(e) => setInvTime(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Academia</label>
                    <input type="text" value={invAcademy} onChange={(e) => setInvAcademy(e.target.value)}
                      placeholder="Nome da academia..."
                      className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors"
                    />
                    {selMatch.gym && (
                      <button
                        onClick={() => setInvAcademy(selMatch.gym!)}
                        className="mt-1.5 flex items-center gap-1 text-xs text-primary active:opacity-70"
                      >
                        <MapPin className="h-3 w-3" /> Usar academia do match: {selMatch.gym}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={sendInvite}
                    disabled={!invDate || !invTime || !invAcademy.trim() || sending}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white bg-gradient-primary shadow-glow active:scale-[0.98] transition-all disabled:opacity-40 mt-1"
                  >
                    {sending ? "Enviando..." : "Enviar convite 💪"}
                  </button>
                </div>
              </>
            )}

            <button onClick={() => setShowInviteModal(false)} className="mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-muted-foreground/60 active:scale-[0.98] transition-all">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
