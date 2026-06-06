"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "newest", label: "最新" },
  { value: "price_asc", label: "价格升序" },
  { value: "price_desc", label: "价格降序" }
];

const stockOptions = [
  { value: "all", label: "全部" },
  { value: "in_stock", label: "有货" },
  { value: "sold_out", label: "售罄" }
];

type FilterValues = {
  category: string;
  q: string;
  sort: string;
  stock: string;
};

export function ProductFilterBar({ values }: { values: FilterValues }) {
  const router = useRouter();
  const [query, setQuery] = useState(values.q);
  const normalized = useMemo(
    () => ({
      category: values.category,
      q: values.q,
      sort: values.sort || "newest",
      stock: values.stock || "all"
    }),
    [values]
  );

  function applyFilters(updates: Partial<FilterValues>) {
    router.replace(productsHref({ ...normalized, q: query, ...updates }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters({ q: query });
  }

  return (
    <section className="mb-5 grid gap-3">
      <form
        className="hidden gap-2 rounded-md border border-line bg-white p-3 md:grid md:grid-cols-[minmax(220px,1fr)_150px_150px_auto] md:items-center"
        action="/products"
      >
        <input name="category" type="hidden" value={normalized.category} />
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-line px-3 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-teal-100">
          <Search className="h-4 w-4 text-muted" />
          <input
            className="min-w-0 flex-1 outline-none"
            defaultValue={normalized.q}
            maxLength={50}
            name="q"
            placeholder="搜索商品"
          />
        </label>
        <Select defaultValue={normalized.sort} name="sort">
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select defaultValue={normalized.stock} name="stock">
          {stockOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <button className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-white transition hover:bg-teal-800 active:scale-[0.98]" type="submit">
          搜索
        </button>
      </form>

      <div className="grid gap-3 rounded-md border border-line bg-white p-3 md:hidden">
        <form onSubmit={submitSearch}>
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-md border border-line bg-wash px-3 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              maxLength={50}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索商品"
              value={query}
            />
          </label>
        </form>

        <MobileOptionGroup
          currentValue={normalized.sort}
          label="排序"
          onSelect={(sort) => applyFilters({ sort })}
          options={sortOptions}
        />
        <MobileOptionGroup
          currentValue={normalized.stock}
          label="库存"
          onSelect={(stock) => applyFilters({ stock })}
          options={stockOptions}
        />
      </div>
    </section>
  );
}

function MobileOptionGroup({
  currentValue,
  label,
  onSelect,
  options
}: {
  currentValue: string;
  label: string;
  onSelect: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <span className="shrink-0 text-xs font-medium text-muted">{label}</span>
      <div className="flex min-w-max gap-2">
        {options.map((option) => (
          <button
            aria-pressed={currentValue === option.value}
            className={cn(
              "h-9 rounded-md border px-3 text-sm font-medium transition active:scale-[0.98]",
              currentValue === option.value
                ? "border-brand bg-teal-50 text-brand"
                : "border-line bg-white text-ink hover:border-brand"
            )}
            key={option.value}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function productsHref(values: FilterValues) {
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(values)) {
    const value = raw.trim();
    if (value && value !== "newest" && value !== "all") {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  return queryString ? `/products?${queryString}` : "/products";
}
