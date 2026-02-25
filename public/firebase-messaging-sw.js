/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications when app is not open
 * 
 * IMPORTANT: This file must be in /public root to work correctly
 */

// Import Firebase scripts (CDN version for service worker)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

// Initialize Firebase in the service worker
// Note: These values are public and safe to expose in client-side code
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
})

const messaging = firebase.messaging()

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload)
  
  const notificationTitle = payload.notification?.title || 'UPPI'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.jpg',
    badge: '/icons/icon-192x192.jpg',
    tag: payload.data?.ride_id || 'uppi-notification',
    data: payload.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification clicked:', event)
  
  event.notification.close()
  
  // Navigate to relevant page based on notification data
  const urlToOpen = event.notification.data?.url || '/uppi/home'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes('/uppi') && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen))
        }
      }
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
