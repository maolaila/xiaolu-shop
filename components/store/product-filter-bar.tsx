"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "newest", label: "推荐" },
  { value: "price_asc", label: "价格低到高" },
  { value: "price_desc", label: "价格高到低" }
];

type FilterValues = {
  category: string;
  q: string;
  sort: string;
};

export function ProductFilterBar({ values }: { values: FilterValues }) {
  const router = useRouter();
  const normalized = useMemo(
    () => ({
      category: values.category,
      q: values.q,
      sort: values.sort || "newest"
    }),
    [values]
  );

  function applySort(sort: string) {
    router.replace(productsHref({ ...normalized, sort }));
  }

  return (
    <section className="mb-4 flex items-center gap-2 overflow-x-auto">
      {sortOptions.map((option) => (
        <button
          aria-pressed={normalized.sort === option.value}
          className={cn(
            "h-9 shrink-0 rounded-full px-3 text-sm font-medium transition active:scale-[0.98]",
            normalized.sort === option.value ? "bg-red-600 text-white" : "bg-white text-ink"
          )}
          key={option.value}
          onClick={() => applySort(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </section>
  );
}

function productsHref(values: FilterValues) {
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(values)) {
    const value = raw.trim();
    if (value && value !== "newest") {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  return queryString ? `/products?${queryString}` : "/products";
}
