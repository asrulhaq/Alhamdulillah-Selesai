const CACHE_NAME = 'story-app-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - menangani notifikasi yang masuk
self.addEventListener('push', (event) => {
  console.log('📬 Push event received:', event);
  
  let notificationData = {
    title: 'Story berhasil dibuat',
    body: 'Anda telah membuat story baru',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'story-notification',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };

  // Handle different types of push data
  if (event.data) {
    try {
      // Try to parse as JSON first
      const pushData = event.data.json();
      console.log('📨 Push data (JSON):', pushData);
      
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.options?.body || pushData.body || notificationData.body,
        icon: pushData.options?.icon || pushData.icon || notificationData.icon,
        badge: pushData.options?.badge || pushData.badge || notificationData.badge,
        tag: pushData.options?.tag || pushData.tag || notificationData.tag,
        data: pushData.data || notificationData.data
      };
    } catch (jsonError) {
      // If JSON parsing fails, try to get as text
      try {
        const textData = event.data.text();
        console.log('📨 Push data (text):', textData);
        
        // If it's a simple text message, use it as body
        if (textData && textData.trim()) {
          notificationData.body = textData;
        }
      } catch (textError) {
        console.error('❌ Error parsing push data as text:', textError);
      }
    }
  }

  // Show notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: 'view',
          title: '👀 Lihat'
        },
        {
          action: 'close',
          title: '❌ Tutup'
        }
      ]
    }
  ).catch(error => {
    console.error('❌ Error showing notification:', error);
    
    // Fallback: try to show a simple notification
    return self.registration.showNotification('Story App', {
      body: 'Anda memiliki notifikasi baru',
      tag: 'fallback-notification'
    });
  });

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
