import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicProducts } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [settings, products] = await Promise.all([
    getSiteSettings(),
    getPublicProducts({
      category: value(params, "category"),
      q: value(params, "q"),
      pageSize: 40
    })
  ]);

  return (
    <div className="mx-auto max-w-7xl px-2 py-2 sm:px-4 sm:py-4">
      {products.length === 0 ? (
        <EmptyState title="没有找到商品" description="换个分类或搜索词试试。" actionHref="/products" actionLabel="查看全部商品" />
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
