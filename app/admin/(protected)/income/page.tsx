import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/utils";
import { getIncomeRecords } from "@/server/services/income";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminIncomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q) ?? "";
  const { records, summary } = await getIncomeRecords({ q });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">收入账本</h1>
          <p className="mt-1 text-sm text-muted">按她现在 Excel 的记法，快速记录客户、商品、收款、成本和利润。</p>
        </div>
        <ButtonLink href="/admin/income/new">
          <Plus className="h-4 w-4" />
          新增记录
        </ButtonLink>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="记录数" value={summary.recordCount} />
        <SummaryCard label="价格合计" value={formatMoney(summary.saleTotal)} />
        <SummaryCard label="收款合计" value={formatMoney(summary.receivedTotal)} />
        <SummaryCard label="人民币成本" value={formatMoney(summary.costCnyTotal)} />
        <SummaryCard label="利润合计" value={formatMoney(summary.profitTotal)} />
      </section>

      <form className="flex flex-wrap gap-2 rounded-md border border-line bg-white p-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-white px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            aria-label="搜索收入记录"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            defaultValue={q}
            maxLength={80}
            name="q"
            placeholder="搜客户、微信、支付方式或商品"
            type="search"
          />
        </div>
        <Button className="px-5" type="submit" variant="secondary">
          搜索
        </Button>
      </form>

      {records.length === 0 ? (
        <EmptyState title="暂无收入记录" description="把 Excel 里的日常流水迁到这里，之后就能按客户和商品搜索。" actionHref="/admin/income/new" actionLabel="新增记录" />
      ) : (
        <section className="overflow-x-auto rounded-md border border-line bg-white">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-wash text-muted">
              <tr>
                <th className="px-4 py-3">日期</th>
                <th className="px-4 py-3">客户</th>
                <th className="px-4 py-3">支付方式</th>
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">价格</th>
                <th className="px-4 py-3">收款</th>
                <th className="px-4 py-3">成本</th>
                <th className="px-4 py-3">利润</th>
                <th className="px-4 py-3">备注</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr className="border-t border-line align-top" key={record.id}>
                  <td className="whitespace-nowrap px-4 py-3">{record.recordDate}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{record.customerName || "-"}</div>
                    {record.contact ? <div className="mt-1 text-xs text-muted">{record.contact}</div> : null}
                  </td>
                  <td className="max-w-[150px] px-4 py-3 text-muted">{record.paymentMethod || "-"}</td>
                  <td className="max-w-[320px] px-4 py-3">
                    <div className="line-clamp-3 whitespace-pre-wrap">{record.productSummary}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{moneyOrDash(record.saleAmount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{moneyOrDash(record.receivedAmount)}</td>
                  <td className="px-4 py-3">
                    <div className="whitespace-nowrap">{record.costJpy ? `JPY ${Number(record.costJpy).toLocaleString("zh-CN")}` : "-"}</div>
                    <div className="mt-1 whitespace-nowrap text-muted">{moneyOrDash(record.costCny)}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-red-600">{moneyOrDash(record.profitAmount)}</td>
                  <td className="max-w-[220px] px-4 py-3 text-muted">
                    <div className="line-clamp-2 whitespace-pre-wrap">{record.purchaseNote || record.costNote || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-brand" href={`/admin/income/${record.id}`}>
                      编辑
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function moneyOrDash(value: string | null) {
  return value == null ? "-" : formatMoney(value);
}
