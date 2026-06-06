"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProductCard as ProductCardType } from "@/server/services/catalog";
import { formatPriceRange } from "@/lib/utils";

export function ProductCard({ product, currency }: { product: ProductCardType; currency: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="h-full overflow-hidden rounded-md bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={`/products/${product.slug}`} className="grid h-full grid-rows-[auto_1fr]">
        <div className="relative aspect-square bg-slate-100">
          {imageFailed ? (
            <div className="grid h-full place-items-center bg-wash px-3 text-center text-xs text-muted">
              商品图片
            </div>
          ) : (
            <img
              src={product.mainImageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        <div className="grid content-start gap-1.5 p-2.5">
          <h3 className="line-clamp-2 min-h-10 text-[13px] font-medium leading-5 text-ink sm:text-sm">{product.name}</h3>
          <div className="min-w-0 text-lg font-bold leading-none text-red-600">
            {formatPriceRange(product.minPrice, product.maxPrice, currency)}
          </div>
          <div className="flex min-h-5 min-w-0 flex-wrap items-center gap-1 text-xs">
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600">人工确认</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
