"use client";

import dynamic from "next/dynamic";

const AIChatbotLoader = dynamic(() => import("@/component/AIChatbotLoader"), { ssr: false });
const ToasterLoader = dynamic(() => import("@/component/ToasterLoader"), { ssr: false });
const Footer = dynamic(() => import("@/component/Footer"), { ssr: false });
const PWAInstallPrompt = dynamic(() => import("@/component/PWAInstallPrompt"), { ssr: false });
const ConnectionStatus = dynamic(() => import("@/component/ConnectionStatus"), { ssr: false });
const ServiceWorkerRegistration = dynamic(() => import("@/component/ServiceWorkerRegistration"), { ssr: false });

export default function ClientScripts() {
  return (
    <>
      <ServiceWorkerRegistration />
      <ConnectionStatus />
      <PWAInstallPrompt />
      <Footer />
      <AIChatbotLoader />
      <ToasterLoader />
    </>
  );
}
