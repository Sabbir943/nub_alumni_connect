"use client";

import dynamic from "next/dynamic";

const AIChatbot = dynamic(() => import("./AIChatbot"), { ssr: false });

export default function AIChatbotLoader() {
  return <AIChatbot />;
}
