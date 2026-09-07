"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("react-hot-toast").then((m) => m.Toaster), {
  ssr: false,
});

export default function ToasterLoader() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2000,
        style: {
          fontSize: "14px",
          fontWeight: 500,
        },
      }}
    />
  );
}