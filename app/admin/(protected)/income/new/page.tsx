import { ButtonLink } from "@/components/ui/button";
import { IncomeRecordForm } from "@/components/admin/income-record-form";

export default function NewIncomeRecordPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">新增收入记录</h1>
          <p className="mt-1 text-sm text-muted">按 Excel 一行流水录入，先记客户、商品和收款，成本可以后补。</p>
        </div>
        <ButtonLink href="/admin/income" variant="secondary">
          返回账本
        </ButtonLink>
      </div>
      <IncomeRecordForm />
    </div>
  );
}
