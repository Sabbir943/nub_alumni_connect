"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { usePathname } from "next/navigation";

export default function PushNotificationManager({ email }) {
  const pathname = usePathname();
  const router = useRouter();
  const registeredRef = useRef(false);

  const saveToken = useCallback(
    async (token) => {
      if (!email || !token) return;
      try {
        await apiFetch("/api/push-tokens", {
          method: "POST",
          body: JSON.stringify({ email, token }),
        });
      } catch (err) {
        console.error("Failed to save push token:", err);
      }
    },
    [email]
  );

  // Web: register FCM token
  useEffect(() => {
    if (!email || registeredRef.current) return;
    registeredRef.current = true;

    const setup = async () => {
      const token = await requestFCMToken();
      if (token) {
        await saveToken(token);
      }
    };

    setup();
  }, [email, saveToken]);

  // Web: foreground message listener
  useEffect(() => {
    if (!email) return;

    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body, icon, image, data } = payload.notification || {};
      const url = data?.url || "/";

      const options = {
        body: body || "",
        icon: icon || "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        image,
        data: { url },
        tag: data?.tag || "nub-notification",
        renotify: true,
      };

      if (Notification.permission === "granted") {
        const n = new Notification(title || "NUB Alumni Connect", options);
        n.onclick = () => {
          window.focus();
          router.push(url);
          n.close();
        };
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [email, router]);

  // Update service worker with current path
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: "SET_CURRENT_PATH",
        path: pathname,
      });
    });
  }, [pathname]);

  return null;
}