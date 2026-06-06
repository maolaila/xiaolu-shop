import { ClipboardCheck, Grid3X3, Search, ShieldCheck, ShoppingCart } from "lucide-react";
import Link from "next/link";

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

      <section className="mb-2 grid grid-cols-4 rounded-md bg-white py-3 text-center text-xs text-ink">
        <QuickEntry href="/products" icon={<Grid3X3 className="h-5 w-5" />} label="全部分类" />
        <QuickEntry href="/cart" icon={<ShoppingCart className="h-5 w-5" />} label="购物车" />
        <QuickEntry href="/orders" icon={<ClipboardCheck className="h-5 w-5" />} label="订单进度" />
        <QuickEntry href="/search" icon={<Search className="h-5 w-5" />} label="搜商品" />
      </section>

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

function QuickEntry({
  href,
  icon,
  label
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link className="grid place-items-center gap-1" href={href}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
