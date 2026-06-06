import Link from "next/link";

import { ProductCard } from "@/components/store/product-card";
import { ProductFilterBar } from "@/components/store/product-filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/server/services/catalog";
import { getPublicProducts, getVisibleCategories } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function productsHref(params: Record<string, string | string[] | undefined>, updates: Record<string, string>) {
  const next = {
    q: value(params, "q") ?? "",
    category: value(params, "category") ?? "",
    sort: value(params, "sort") ?? "",
    stock: value(params, "stock") ?? "",
    ...updates
  };
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(next)) {
    const item = raw.trim();
    if (item && item !== "newest" && item !== "all") {
      query.set(key, item);
    }
  }
  const queryString = query.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentCategory = value(params, "category") ?? "";
  const [settings, categories, products] = await Promise.all([
    getSiteSettings(),
    getVisibleCategories(),
    getPublicProducts({
      category: value(params, "category"),
      q: value(params, "q"),
      sort: value(params, "sort"),
      stock: value(params, "stock")
    })
  ]);
  const activeCategory = categories.find((category) => category.slug === currentCategory);
  const totalCategoryCount = categories.reduce((sum, category) => sum + (category.productCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{activeCategory?.name ?? "全部商品"}</h1>
          <p className="mt-1 text-sm text-muted">当前展示 {products.length} 件商品</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <CategoryRail
          categories={categories}
          currentCategory={currentCategory}
          params={params}
          totalCount={totalCategoryCount}
        />

        <main className="min-w-0">
          <CategoryTabs categories={categories} currentCategory={currentCategory} params={params} />

          <ProductFilterBar
            values={{
              category: currentCategory,
              q: value(params, "q") ?? "",
              sort: value(params, "sort") ?? "newest",
              stock: value(params, "stock") ?? "all"
            }}
          />

          {products.length === 0 ? (
            <EmptyState title="没有找到商品" description="请更换分类或搜索词。" actionHref="/products" actionLabel="查看全部商品" />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard currency={settings.currency} key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CategoryRail({
  categories,
  currentCategory,
  params,
  totalCount
}: {
  categories: CategoryRow[];
  currentCategory: string;
  params: Record<string, string | string[] | undefined>;
  totalCount: number;
}) {
  return (
    <aside className="hidden self-start rounded-md border border-line bg-white p-2 lg:sticky lg:top-24 lg:block">
      <CategoryLink
        active={!currentCategory}
        count={totalCount}
        href={productsHref(params, { category: "" })}
        label="全部"
      />
      {categories.map((category) => (
        <CategoryLink
          active={currentCategory === category.slug}
          count={category.productCount ?? 0}
          href={productsHref(params, { category: category.slug })}
          key={category.id}
          label={category.name}
        />
      ))}
    </aside>
  );
}

function CategoryTabs({
  categories,
  currentCategory,
  params
}: {
  categories: CategoryRow[];
  currentCategory: string;
  params: Record<string, string | string[] | undefined>;
}) {
  return (
    <div className="-mx-4 mb-4 overflow-x-auto border-y border-line bg-white px-4 py-2 lg:hidden">
      <div className="flex min-w-max gap-2">
        <Link
          className={cn(
            "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition active:scale-[0.98]",
            currentCategory ? "border-line bg-white text-muted" : "border-brand bg-teal-50 text-brand"
          )}
          href={productsHref(params, { category: "" })}
        >
          全部
        </Link>
        {categories.map((category) => (
          <Link
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium transition active:scale-[0.98]",
              currentCategory === category.slug ? "border-brand bg-teal-50 text-brand" : "border-line bg-white text-muted"
            )}
            href={productsHref(params, { category: category.slug })}
            key={category.id}
          >
            <span>{category.name}</span>
            <span className="text-xs opacity-70">{category.productCount ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CategoryLink({
  active,
  count,
  href,
  label
}: {
  active: boolean;
  count: number;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={cn(
        "mb-1 flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm transition last:mb-0",
        active ? "bg-teal-50 font-medium text-brand" : "text-muted hover:bg-wash hover:text-ink"
      )}
      href={href}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 text-xs opacity-70">{count}</span>
    </Link>
  );
}
