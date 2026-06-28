import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SELF_URL          = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".supabase.co/functions/v1");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function push(user_id: string, title: string, body: string, url: string) {
  await fetch(`${SELF_URL}/send-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ user_id, title, body, url }),
  });
}

Deno.serve(async () => {
  const now = new Date();

  // Janela de 1 dia: notifica invites aceitos que ocorrem entre 23h e 25h a partir de agora
  const w1_from = new Date(now.getTime() + 23 * 3600_000).toISOString();
  const w1_to   = new Date(now.getTime() + 25 * 3600_000).toISOString();

  // Janela de 2h: notifica invites aceitos entre 1h30 e 2h30 a partir de agora
  const w2_from = new Date(now.getTime() + 90  * 60_000).toISOString();
  const w2_to   = new Date(now.getTime() + 150 * 60_000).toISOString();

  // --- Lembrete de 1 dia ---
  const { data: soon1d } = await supabase
    .from("workout_invites")
    .select("id, from_user, to_user, academy_name, scheduled_at")
    .eq("status", "accepted")
    .eq("notified_1d", false)
    .gte("scheduled_at", w1_from)
    .lte("scheduled_at", w1_to);

  for (const inv of (soon1d ?? [])) {
    const at = new Date(inv.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const msg = `Treino amanhã às ${at} em ${inv.academy_name}. Não esqueça! 💪`;
    await push(inv.from_user, "Lembrete de treino", msg, "/treino");
    await push(inv.to_user,   "Lembrete de treino", msg, "/treino");
    await supabase.from("workout_invites").update({ notified_1d: true }).eq("id", inv.id);
  }

  // --- Lembrete de 2h ---
  const { data: soon2h } = await supabase
    .from("workout_invites")
    .select("id, from_user, to_user, academy_name, scheduled_at")
    .eq("status", "accepted")
    .eq("notified_2h", false)
    .gte("scheduled_at", w2_from)
    .lte("scheduled_at", w2_to);

  for (const inv of (soon2h ?? [])) {
    const at = new Date(inv.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const msg = `Seu treino começa em ~2h às ${at} em ${inv.academy_name}. Bora! 🔥`;
    await push(inv.from_user, "Hora do treino!", msg, "/treino");
    await push(inv.to_user,   "Hora do treino!", msg, "/treino");
    await supabase.from("workout_invites").update({ notified_2h: true }).eq("id", inv.id);
  }

  return new Response(JSON.stringify({ checked_1d: (soon1d ?? []).length, checked_2h: (soon2h ?? []).length }));
});
