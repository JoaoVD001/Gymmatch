self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const tag  = data.url?.includes('treino') ? 'workout-notif' : 'lucia-notif';
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'GymMatch', {
      body: data.body ?? '',
      tag,
      renotify: true,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? '/', self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url === target && 'focus' in c) return c.focus();
      }
      return clients.openWindow(target);
    })
  );
});
