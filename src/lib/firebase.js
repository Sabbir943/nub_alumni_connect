import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

function getApp() {
  if (typeof window === "undefined") return null;
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

function getMessagingInstance() {
  if (typeof window === "undefined") return null;
  if (!messaging) {
    try {
      messaging = getMessaging(getApp());
    } catch (err) {
      console.error("Firebase messaging init failed:", err);
      return null;
    }
  }
  return messaging;
}

export async function requestFCMToken() {
  const msg = getMessagingInstance();
  if (!msg) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (err) {
    console.error("FCM token request failed:", err);
    return null;
  }
}

export function onForegroundMessage(callback) {
  const msg = getMessagingInstance();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    callback(payload);
  });
}

export { firebaseConfig };
