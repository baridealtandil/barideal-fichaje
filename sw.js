// Service Worker — Bar Ideal Fichaje
// Maneja push notifications y cache básico

self.addEventListener('install', e => self.skipWaiting());

// Responder al mensaje SKIP_WAITING forzado desde el cliente
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Recibir push del servidor
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Bar Ideal', {
      body:    data.body  || 'Recordatorio de fichaje',
      icon:    data.icon  || '/logo-ideal.png',
      badge:   data.badge || '/logo-ideal.png',
      vibrate: [200, 100, 200],
      tag:     'fichaje-recordatorio',  // reemplaza la anterior si aún está visible
      renotify: false,
      data:    { url: data.url || '/fichaje-barideal.html' }
    })
  );
});

// Al tocar la notificación: abrir la app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/fichaje-barideal.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes('fichaje-barideal'));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
