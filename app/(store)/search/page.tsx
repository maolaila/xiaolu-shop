import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicProducts } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (value(params, "q") ?? "").trim();
  const [settings, products] = await Promise.all([
    getSiteSettings(),
    q ? getPublicProducts({ q, pageSize: 40 }) : Promise.resolve([])
  ]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink">搜索结果</h1>
        <p className="mt-1 text-sm text-muted">{q ? `商品名称包含「${q}」` : "请输入商品名称搜索"}</p>
      </div>

      {!q ? (
        <EmptyState title="输入商品名称" description="在顶部搜索框输入关键词后查看结果。" actionHref="/" actionLabel="返回首页" />
      ) : products.length === 0 ? (
        <EmptyState title="没有找到商品" description="换个商品名称试试。" actionHref="/" actionLabel="返回首页" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard currency={settings.currency} key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
