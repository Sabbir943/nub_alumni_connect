"use client";

import dynamic from "next/dynamic";

const AIChatbotLoader = dynamic(() => import("@/component/AIChatbotLoader"), { ssr: false });
const ToasterLoader = dynamic(() => import("@/component/ToasterLoader"), { ssr: false });
const Footer = dynamic(() => import("@/component/Footer"), { ssr: false });

export default function ClientScripts() {
  return (
    <>
      <Footer />
      <AIChatbotLoader />
      <ToasterLoader />
    </>
  );
}
