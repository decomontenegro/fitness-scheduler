// Firebase Messaging Service Worker (placeholder)
// This file prevents 404 errors when the app looks for Firebase messaging
// Actual implementation can be added when Firebase is configured

self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated.');
});

self.addEventListener('fetch', function(event) {
  // Pass through all requests
  event.respondWith(fetch(event.request));
});