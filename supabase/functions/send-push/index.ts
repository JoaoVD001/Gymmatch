import { createClient } from "jsr:@supabase/supabase-js@2";
// @ts-ignore — web-push via npm in Deno
import webpush from "npm:web-push@3";

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY    = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY   = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL         = Deno.env.get("VAPID_EMAIL")!;

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });

  try {
    const { user_id, title, body, url = "/" } = await req.json() as { user_id: string; title: string; body: string; url?: string };

    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!sub) return new Response(JSON.stringify({ ok: false, reason: "no_subscription" }), { status: 200 });

    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url }),
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
