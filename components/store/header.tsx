import { Search } from "lucide-react";
import Link from "next/link";

import { BackButton } from "@/components/store/back-button";
import { getVisibleCategories } from "@/server/services/catalog";

export async function StoreHeader() {
  const categories = await getVisibleCategories();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2">
        <BackButton />
        <form action="/search" className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-wash px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            aria-label="搜索商品"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
            enterKeyHint="search"
            maxLength={50}
            name="q"
            placeholder="搜索商品名称"
            type="search"
          />
        </form>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 pb-2 text-[15px] font-medium">
        <Link className="shrink-0 border-b-2 border-red-600 pb-1 text-red-600" href="/">
          推荐
        </Link>
        {categories.map((category) => (
          <Link
            className="shrink-0 border-b-2 border-transparent pb-1 text-ink"
            href={`/products?category=${category.slug}`}
            key={category.id}
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
