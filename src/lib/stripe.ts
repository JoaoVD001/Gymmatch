import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PRICE_IDS: Record<"gold" | "diamond", string> = {
  gold: "price_1TmPv3DKLvTK7rzsk7kYOHpO",
  diamond: "price_1TmPxnDKLvTK7rzsDnoiUqPR",
};

async function stripePost(path: string, body: Record<string, string>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado");

  const params = new URLSearchParams(body);
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const err = (json.error as Record<string, string> | undefined)?.message ?? "Erro Stripe";
    throw new Error(err);
  }
  return json;
}

async function stripeGet(path: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado");

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const err = (json.error as Record<string, string> | undefined)?.message ?? "Erro Stripe";
    throw new Error(err);
  }
  return json;
}

export const createCheckoutSession = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { plan, userId, userEmail, successUrl, cancelUrl } = ctx.data as {
    plan: "gold" | "diamond";
    userId: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
  };

  const priceId = PRICE_IDS[plan];

  const session = await stripePost("/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    customer_email: userEmail,
    client_reference_id: userId,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
    cancel_url: cancelUrl,
    "metadata[userId]": userId,
    "metadata[plan]": plan,
    locale: "pt-BR",
  });

  return { url: session.url as string };
});

export const activatePlanFromSession = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { sessionId } = ctx.data as { sessionId: string };

  const session = await stripeGet(`/checkout/sessions/${sessionId}`) as {
    payment_status: string;
    status: string;
    metadata: { userId: string; plan: string };
    client_reference_id: string;
  };

  if (session.payment_status !== "paid" && session.status !== "complete") {
    throw new Error("Sessão não completada");
  }

  const userId = session.metadata?.userId ?? session.client_reference_id;
  const plan = session.metadata?.plan as "gold" | "diamond";

  if (!userId || !plan) throw new Error("Dados da sessão inválidos");

  await supabaseAdmin.from("profiles").update({ plan }).eq("id", userId);

  return { success: true, plan };
});
