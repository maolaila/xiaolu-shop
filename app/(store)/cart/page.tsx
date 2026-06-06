import { Trash2 } from "lucide-react";
import Link from "next/link";

import { removeCartItemAction, clearCartAction } from "@/app/actions/cart";
import { CartQuantityForm } from "@/components/store/cart-forms";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getCartItems } from "@/server/services/cart";
import { getSiteSettings } from "@/server/services/settings";

export default async function CartPage() {
  const user = await requireUser();
  const [items, settings] = await Promise.all([getCartItems(user.id), getSiteSettings()]);
  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const hasInvalid = items.some(
    (item) => item.productStatus !== "active" || item.variantStatus !== "active"
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:py-8 lg:pb-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold">购物车</h1>
          <p className="mt-1 text-sm text-muted">提交后由客服人工确认是否有货。</p>
        </div>
        {items.length > 0 ? (
          <form action={clearCartAction}>
            <Button className="w-full sm:w-auto" type="submit" variant="secondary">
              清空购物车
            </Button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState title="购物车为空" description="先去商品列表挑选商品。" actionHref="/products" actionLabel="去挑商品" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-md border border-line bg-white">
            {items.map((item) => {
              const invalid =
                item.productStatus !== "active"
                  ? "商品已下架"
                  : item.variantStatus !== "active"
                    ? "商品不可用"
                    : null;
              const optionText = Object.entries(item.optionValues)
                .map(([key, value]) => `${key}: ${value}`)
                .join(" / ");
              return (
                <div className="grid grid-cols-[84px_1fr] gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[96px_1fr_180px_80px] md:gap-4" key={item.id}>
                  <Link className="aspect-square overflow-hidden rounded-md bg-slate-100" href={`/products/${item.productSlug}`}>
                    <img alt={item.productName} className="h-full w-full object-cover" src={item.mainImageUrl} />
                  </Link>
                  <div className="min-w-0">
                    <Link className="font-semibold hover:text-brand" href={`/products/${item.productSlug}`}>
                      {item.productName}
                    </Link>
                    {optionText ? <p className="mt-1 text-sm text-muted">{optionText}</p> : null}
                    <p className="mt-2 text-sm font-medium text-brand">{formatMoney(item.unitPrice, settings.currency)}</p>
                    {invalid ? <p className="mt-2 text-sm text-red-600">{invalid}</p> : null}
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <CartQuantityForm cartItemId={item.id} quantity={item.quantity} />
                  </div>
                  <form action={removeCartItemAction} className="col-span-2 md:col-span-1">
                    <input type="hidden" name="cartItemId" value={item.id} />
                    <Button className="h-9 px-3" type="submit" variant="danger" title="删除">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              );
            })}
          </section>
          <aside className="hidden h-fit rounded-md border border-line bg-white p-5 lg:block">
            <div className="flex justify-between text-lg font-semibold">
              <span>合计</span>
              <span>{formatMoney(total, settings.currency)}</span>
            </div>
            <p className="mt-3 text-sm text-muted">最终是否有货、付款金额和发货时间以后台人工确认为准。</p>
            {hasInvalid ? <p className="mt-3 text-sm text-red-600">存在不可结算商品，请先删除。</p> : null}
            {hasInvalid ? (
              <button
                className="mt-5 inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-medium text-muted"
                disabled
                type="button"
              >
                请先调整购物车
              </button>
            ) : (
              <ButtonLink className="mt-5 w-full" href="/checkout">
                去结算
              </ButtonLink>
            )}
          </aside>
          <div className="fixed inset-x-0 bottom-14 z-30 border-t border-line bg-white px-4 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted">合计</div>
                <div className="text-lg font-bold text-red-600">{formatMoney(total, settings.currency)}</div>
              </div>
              {hasInvalid ? (
                <button
                  className="h-10 shrink-0 cursor-not-allowed rounded-full bg-slate-200 px-5 text-sm font-medium text-muted"
                  disabled
                  type="button"
                >
                  请先调整
                </button>
              ) : (
                <ButtonLink className="h-10 shrink-0 rounded-full bg-red-600 px-6 hover:bg-red-700" href="/checkout">
                  去结算
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
