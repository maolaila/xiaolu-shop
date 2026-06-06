import { ShieldCheck } from "lucide-react";

import { ProductCard } from "@/components/store/product-card";
import { getPublicProducts } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    getSiteSettings(),
    getPublicProducts({ pageSize: 40 })
  ]);

  return (
    <div className="mx-auto max-w-7xl px-2 py-2 sm:px-4 sm:py-4">
      <div className="mb-2 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs text-muted">
        <ShieldCheck className="h-4 w-4 shrink-0 text-red-600" />
        <span className="min-w-0 truncate">先下单，客服人工确认是否有货和付款方式</span>
      </div>

      <div className="mb-2 flex items-center justify-between px-1">
        <h1 className="text-base font-semibold text-ink">猜你喜欢</h1>
        <span className="text-xs text-muted">价格下单后确认</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard currency={settings.currency} key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
