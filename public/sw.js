/* This is the service worker for the Alamo PWA.
It is used to cache the static assets of the app and serve them offline.
It is also used to handle the background sync and push notifications.
It is also used to handle the notification clicks.
It is also used to handle the messages from the main app.
*/

// const CACHE_NAME = 'alamo-pwa-v4.0.1'; // Version automatically replaced during build
// const urlsToCache = [
//   '/',
//   '/manifest.json',
//   '/alamo_logo.png',
//   '/ahc-logo.png',
//   // Add other static assets you want to cache
// ];

// // Install event - cache initial resources
// self.addEventListener('install', (event) => {
//   console.log('Service Worker installing...');
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then((cache) => {
//         console.log('Opened cache:', CACHE_NAME);
//         return cache.addAll(urlsToCache);
//       })
//   );
//   // Force the waiting service worker to become the active service worker
//   self.skipWaiting();
// });

// // Activate event - clean up old caches
// self.addEventListener('activate', (event) => {
//   console.log('Service Worker activated');
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           if (cacheName !== CACHE_NAME) {
//             console.log('Deleting old cache:', cacheName);
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//   );
//   // Claim control of all clients
//   self.clients.claim();
// });

// // Fetch event - serve from cache, fallback to network
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request)
//       .then((response) => {
//         // Return cached version or fetch from network
//         if (response) {
//           return response;
//         }
        
//         // Clone the request because it's a stream and can only be used once
//         const fetchRequest = event.request.clone();
        
//         return fetch(fetchRequest).then((response) => {
//           // Check if we received a valid response
//           if (!response || response.status !== 200 || response.type !== 'basic') {
//             return response;
//           }
          
//           // Only cache GET requests (POST, PUT, DELETE, etc. are not cacheable)
//           if (event.request.method === 'GET') {
//             // Clone the response because it's a stream and can only be used once
//             const responseToCache = response.clone();
            
//             caches.open(CACHE_NAME)
//               .then((cache) => {
//                 cache.put(event.request, responseToCache);
//               });
//           }
          
//           return response;
//         }).catch(() => {
//           // Return a fallback page for navigation requests when offline
//           if (event.request.destination === 'document') {
//             return caches.match('/');
//           }
//         });
//       })
//   );
// });

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Handle background sync logic here
  }
});

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/alamo_logo.png',
      badge: '/alamo_logo.png',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 