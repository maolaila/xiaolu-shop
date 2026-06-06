"use client";

import { FormEvent } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BackButton } from "@/components/store/back-button";
import { cn } from "@/lib/utils";

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
};

export function StoreHeaderClient({ categories }: { categories: HeaderCategory[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "";
  const searchQuery = pathname === "/search" ? searchParams.get("q") ?? "" : "";
  const showBackButton = pathname !== "/";

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2">
        {showBackButton ? <BackButton /> : null}
        <form
          action="/search"
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-wash px-3"
          onSubmit={submitSearch}
        >
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            aria-label="搜索商品"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
            defaultValue={searchQuery}
            enterKeyHint="search"
            key={searchQuery}
            maxLength={50}
            name="q"
            placeholder="搜索商品名称"
            type="search"
          />
        </form>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 pb-2 text-[15px] font-medium">
        <Link
          className={cn(
            "shrink-0 border-b-2 pb-1",
            pathname === "/" ? "border-red-600 text-red-600" : "border-transparent text-ink"
          )}
          href="/"
        >
          推荐
        </Link>
        <Link
          className={cn(
            "shrink-0 border-b-2 pb-1",
            pathname === "/products" && !currentCategory ? "border-red-600 text-red-600" : "border-transparent text-ink"
          )}
          href="/products"
        >
          全部
        </Link>
        {categories.map((category) => {
          const active = pathname.startsWith("/products") && currentCategory === category.slug;
          return (
            <Link
              className={cn(
                "shrink-0 border-b-2 pb-1",
                active ? "border-red-600 text-red-600" : "border-transparent text-ink"
              )}
              href={`/products?category=${category.slug}`}
              key={category.id}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
