"use client";
import { useRouter } from "next/navigation";

export default function BackSmartButton({
  label = "← Back",
  fallbackHref = "/",
  className = "",
}: { label?: string; fallbackHref?: string; className?: string }) {
  const router = useRouter();
  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      setTimeout(() => {
        // If back didn’t navigate (rare), force the fallback
        if (window.location.pathname === window.location.pathname) {
          router.push(fallbackHref);
        }
      }, 150);
    } else {
      router.push(fallbackHref);
    }
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 shadow-sm ${className}`}
    >
      {label}
    </button>
  );
}
