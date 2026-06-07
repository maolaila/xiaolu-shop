import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteIncomeRecordAction } from "@/app/admin/actions";
import { IncomeRecordForm } from "@/components/admin/income-record-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { getIncomeRecord } from "@/server/services/income";

type Params = Promise<{ id: string }>;

export default async function EditIncomeRecordPage({ params }: { params: Params }) {
  const { id } = await params;
  const record = await getIncomeRecord(id);
  if (!record) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">编辑收入记录</h1>
          <p className="mt-1 text-sm text-muted">修改收款、成本或利润后会同步更新账本汇总。</p>
        </div>
        <ButtonLink href="/admin/income" variant="secondary">
          返回账本
        </ButtonLink>
      </div>

      <IncomeRecordForm record={record} />

      <form action={deleteIncomeRecordAction} className="rounded-md border border-red-200 bg-red-50 p-4">
        <input name="id" type="hidden" value={record.id} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-red-700">删除记录</h2>
            <p className="mt-1 text-sm text-red-700/80">删除后不会影响前台订单，只移除这条收入账本流水。</p>
          </div>
          <Button variant="danger">
            <Trash2 className="h-4 w-4" />
            删除记录
          </Button>
        </div>
      </form>
    </div>
  );
}
