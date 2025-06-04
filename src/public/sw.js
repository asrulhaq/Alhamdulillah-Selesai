const CACHE_NAME = 'story-app-v3';

const urlsToCache = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/app.css',
  '/app.webmanifest',
  '/favicon.png',
  '/logo.png',
  '/images/logo.png',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('👷 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Pre-caching offline assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Pre-caching complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Pre-caching failed:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('👷 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
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

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  console.log('🔍 Fetching:', request.url);

  // Handle API requests differently from static assets
  if (url.origin === location.origin) {
    // Static assets - Cache First strategy
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('✅ Cache hit for static asset:', request.url);
            return response;
          }

          console.log('🌐 Network request for static asset:', request.url);
          return fetch(request)
            .then((networkResponse) => {
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('💾 Cached new static asset:', request.url);
                });

              return networkResponse;
            })
            .catch((error) => {
              console.error('❌ Static asset fetch failed:', error);
              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return caches.match('/index.html');
              }
              return new Response('Offline content not available');
            });
        })
    );
  } else {
    // API requests - Network First strategy
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          console.log('🌐 Network response for API request:', request.url);
          
          // Clone the response before caching it
          const responseToCache = networkResponse.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
              console.log('💾 Cached API response:', request.url);
            });

          return networkResponse;
        })
        .catch((error) => {
          console.log('📡 Network request failed, trying cache:', request.url);
          
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('✅ Returning cached API response:', request.url);
                return cachedResponse;
              }
              
              console.error('❌ No cached data available for:', request.url);
              throw error;
            });
        })
    );
  }
});
