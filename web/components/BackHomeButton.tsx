"use client";
import { useRouter } from "next/navigation";

export default function BackHomeButton({
  label = "← Back to Home",
  className = "",
}: { label?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 shadow-sm ${className}`}
    >
      {label}
    </button>
  );
}
