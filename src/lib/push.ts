import { supabase } from "@/integrations/supabase/client";

let _swReg: ServiceWorkerRegistration | null = null;

export async function registerSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    _swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    // SW unavailable in this env (dev HTTP etc.)
  }
}

export async function askNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function subscribePush(userId: string): Promise<void> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey || !('PushManager' in window)) return;

  try {
    const reg = _swReg ?? (await navigator.serviceWorker?.ready.catch(() => null));
    if (!reg) return;

    const granted = await askNotifPermission();
    if (!granted) return;

    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as string,
    });

    const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("push_subscriptions").upsert(
      { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch {
    // push not supported or blocked
  }
}

export async function fireLuciaPush(body: string): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const title = 'Lucia 💜';
  const opts = {
    body: body.length > 100 ? body.slice(0, 97) + '…' : body,
    tag: 'lucia-notif',
    renotify: true,
  } as NotificationOptions;
  try {
    const reg = _swReg ?? (await navigator.serviceWorker?.ready.catch(() => null));
    if (reg) reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch {
    try { new Notification(title, opts); } catch { /* sem suporte */ }
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
