/* global importScripts, firebase */
// Firebase Cloud Messaging background service worker for MrCash.
// This runs independently of the app so push notifications arrive even
// when the tab is closed or in the background.

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAd9KgnzExZ5RdrJVB_hpzxUvrqHiQ3jmU",
  authDomain: "mrcash-com.firebaseapp.com",
  projectId: "mrcash-com",
  storageBucket: "mrcash-com.firebasestorage.app",
  messagingSenderId: "348374269609",
  appId: "1:348374269609:web:9fed2a4f69f2c0f00ff3b8",
  measurementId: "G-9ZZLG53Z64",
});

const messaging = firebase.messaging();

// Handle background messages (tab closed / not focused).
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "MrCash";
  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "You have a new update on MrCash.";

  self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    data: { url: payload.data?.url || "/" },
  });
});

// Focus or open the app when a notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
