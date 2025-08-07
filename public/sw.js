const CACHE_NAME = 'fitness-scheduler-v1';
const urlsToCache = [
  '/',
  '/favicon.ico',
  '/notification-sound.mp3'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch events
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push events
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id,
        url: data.url
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver detalhes',
          icon: '/icons/checkmark.png'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/icons/xmark.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app to the relevant page
    const url = event.notification.data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default click behavior
    const url = event.notification.data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Sync pending notifications when back online
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      const notifications = await response.json();
      // Process any pending notifications
      console.log('Synced notifications:', notifications.length);
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}