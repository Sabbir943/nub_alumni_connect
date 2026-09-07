"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiWifiOff } from "react-icons/fi";

export default function ConnectionStatus() {
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return !navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setShowBanner(false);
    const handleOffline = () => setShowBanner(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-zinc-800 dark:bg-zinc-900 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <FiWifiOff className="w-4 h-4 text-amber-400" />
          <span>You&apos;re offline. Some features may be limited.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
