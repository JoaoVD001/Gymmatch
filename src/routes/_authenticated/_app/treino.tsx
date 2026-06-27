import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/treino")({ component: Treino });

type Log = { id: string; date: string; description: string; updated_at: string };

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_PT[dt.getDay()]}, ${d} ${MONTHS_PT[m - 1]}`;
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function Treino() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [addingToday, setAddingToday] = useState(false);
  const [todayDraft, setTodayDraft] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const today = todayISO();

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any)("workout_logs")
      .select("id,date,description,updated_at")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => { setLogs((data ?? []) as Log[]); setLoading(false); });
  }, [user]);

  const todayLog = logs.find((l) => l.date === today);

  async function saveToday() {
    if (!user || !todayDraft.trim()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)("workout_logs")
      .upsert({ user_id: user.id, date: today, description: todayDraft.trim(), updated_at: new Date().toISOString() }, { onConflict: "user_id,date" })
      .select("id,date,description,updated_at").single();
    if (error) { toast.error(error.message); return; }
    setLogs((prev) => {
      const filtered = prev.filter((l) => l.date !== today);
      return [data as Log, ...filtered];
    });
    setAddingToday(false);
    setTodayDraft("");
    toast.success("Treino salvo!");
  }

  async function saveEdit(id: string) {
    if (!draftText.trim()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("workout_logs")
      .update({ description: draftText.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLogs((prev) => prev.map((l) => l.id === id ? { ...l, description: draftText.trim() } : l));
    setEditingId(null);
  }

  async function deleteLog(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("workout_logs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLogs((prev) => prev.filter((l) => l.id !== id));
    toast.success("Registro removido");
  }

  function startEdit(log: Log) {
    setEditingId(log.id);
    setDraftText(log.description);
    setExpanded(log.id);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function startAddToday() {
    setTodayDraft(todayLog?.description ?? "");
    setAddingToday(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  if (loading) return (
    <div className="grid min-h-screen place-items-center bg-background">
      <span className="text-muted-foreground text-sm">Carregando...</span>
    </div>
  );

  const pastLogs = logs.filter((l) => l.date !== today);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Dumbbell className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Meu Treino</h1>
            <p className="text-xs text-muted-foreground">{logs.length} registro{logs.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3">

        {/* ── Card de hoje ── */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Hoje</p>
              <p className="text-sm font-medium text-foreground">{formatDate(today)}</p>
            </div>
            {!addingToday && (
              <button
                onClick={startAddToday}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white bg-gradient-primary shadow-glow transition-all active:scale-95"
              >
                {todayLog ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {todayLog ? "Editar" : "Adicionar"}
              </button>
            )}
          </div>

          {addingToday ? (
            <div className="px-4 pb-4 space-y-2">
              <textarea
                ref={textareaRef}
                value={todayDraft}
                onChange={(e) => setTodayDraft(e.target.value)}
                placeholder="Descreva seu treino de hoje — exercícios, séries, observações..."
                className="w-full rounded-xl bg-muted/50 border border-border/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/50 transition-colors"
                rows={5}
              />
              <div className="flex gap-2">
                <button onClick={saveToday} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-primary shadow-glow active:scale-[0.98] transition-all">
                  <Check className="h-4 w-4" /> Salvar
                </button>
                <button onClick={() => { setAddingToday(false); setTodayDraft(""); }} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground active:scale-95 transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : todayLog ? (
            <div className="px-4 pb-4">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{todayLog.description}</p>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground/60 italic">Nenhum treino registrado hoje.</p>
            </div>
          )}
        </div>

        {/* ── Registros anteriores ── */}
        {pastLogs.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Histórico</p>
            <div className="space-y-2">
              {pastLogs.map((log) => {
                const isExpanded = expanded === log.id;
                const isEditing = editingId === log.id;
                return (
                  <div key={log.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    {/* Row de título */}
                    <button
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                      onClick={() => { if (!isEditing) setExpanded(isExpanded ? null : log.id); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
                          <Dumbbell className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{formatDate(log.date)}</p>
                          {!isExpanded && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{log.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isExpanded && !isEditing && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); startEdit(log); }} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteLog(log.id); }} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Conteúdo expandido */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/30 pt-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              ref={textareaRef}
                              value={draftText}
                              onChange={(e) => setDraftText(e.target.value)}
                              className="w-full rounded-xl bg-muted/50 border border-border/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/50 transition-colors"
                              rows={5}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(log.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-primary shadow-glow active:scale-[0.98] transition-all">
                                <Check className="h-4 w-4" /> Salvar
                              </button>
                              <button onClick={() => setEditingId(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground active:scale-95 transition-all">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{log.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
              <Dumbbell className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Nenhum treino ainda</p>
              <p className="text-sm text-muted-foreground mt-1">Registre seu primeiro treino hoje</p>
            </div>
            <button onClick={startAddToday} className="flex items-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-glow active:scale-95 transition-all">
              <Plus className="h-4 w-4" /> Registrar treino
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
