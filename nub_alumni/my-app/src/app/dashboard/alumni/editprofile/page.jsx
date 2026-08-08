"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditProfile() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/alumni/Profile");
  }, [router]);
  return null;
}
