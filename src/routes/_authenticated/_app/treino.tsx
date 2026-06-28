import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Pencil, X, Check, Dumbbell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/treino")({ component: Treino });

type Schedule = { mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string };

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

function Treino() {
  const { user } = useAuth();
  const [schedule, setSchedule]     = useState<Schedule>(EMPTY);
  const [loading, setLoading]       = useState(true);
  const [editingDay, setEditingDay] = useState<keyof Schedule | null>(null);
  const [dayDraft, setDayDraft]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any)("workout_schedule")
      .select("mon,tue,wed,thu,fri,sat,sun")
      .eq("user_id", user.id)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => { if (data) setSchedule(data as Schedule); setLoading(false); });
  }, [user]);

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

  if (loading) return (
    <div className="grid min-h-screen place-items-center bg-background">
      <span className="text-muted-foreground text-sm">Carregando...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Dumbbell className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Meu Treino</h1>
            <p className="text-xs text-muted-foreground">Plano semanal</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Plano da Semana</p>

        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
          {WEEK_DAYS.map(({ key, short, full }) => {
            const isToday   = key === TODAY_KEY;
            const isEditing = editingDay === key;
            const value     = schedule[key];

            return (
              <div key={key} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${isToday ? "bg-primary/8" : ""}`}>
                {/* Dia */}
                <div className="w-10 shrink-0 text-center">
                  <p className={`text-[11px] font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{short}</p>
                  {isToday && <div className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-primary" />}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      value={dayDraft}
                      onChange={(e) => setDayDraft(e.target.value)}
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

                {/* Ações */}
                {isEditing ? (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => saveDay(key)} className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary active:scale-90 transition-all">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingDay(null)} className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted-foreground active:scale-90 transition-all">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(key)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
