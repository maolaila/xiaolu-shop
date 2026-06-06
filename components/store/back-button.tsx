"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      aria-label="返回"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink active:bg-wash"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/");
      }}
      type="button"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );
}
