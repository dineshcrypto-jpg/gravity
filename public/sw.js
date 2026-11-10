// KSN Super Store - Service Worker for Mobile Order Notifications & Background Web Push
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background Push Event: Wakes up phone and shows notification even if browser/app is closed
self.addEventListener('push', (event) => {
  let data = {
    title: "🛍️ New Order Received!",
    body: "A new customer order has been placed. Tap to open orders.",
    url: "/admin/orders",
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      const text = event.data.text();
      if (text) data.body = text;
    }
  }

  const options = {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [300, 100, 300, 100, 300],
    tag: "order-" + Date.now(),
    renotify: true,
    data: {
      url: data.url || "/admin/orders",
    },
    actions: [
      { action: "open_orders", title: "View Order" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click: Opens orders page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && client.url.includes('/admin/orders') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
