"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import { createIncomeRecordAction, updateIncomeRecordAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { emptyActionState } from "@/lib/action-state";
import type { IncomeRecordRow } from "@/server/services/income";

export function IncomeRecordForm({ record }: { record?: IncomeRecordRow }) {
  const [state, action, pending] = useActionState(
    record ? updateIncomeRecordAction : createIncomeRecordAction,
    emptyActionState
  );

  return (
    <form action={action} className="grid gap-6">
      {record ? <input name="id" type="hidden" value={record.id} /> : null}

      <section className="grid gap-4 rounded-md border border-line bg-white p-4">
        <h2 className="text-base font-semibold text-ink">客户和收款</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="日期">
            <Input name="recordDate" type="date" defaultValue={record?.recordDate ?? today()} required />
          </Field>
          <Field label="客户姓名" hint="没有姓名时，填微信号也可以。">
            <Input name="customerName" defaultValue={record?.customerName ?? ""} maxLength={80} />
          </Field>
          <Field label="电话/微信号">
            <Input name="contact" defaultValue={record?.contact ?? ""} maxLength={120} />
          </Field>
          <Field label="支付方式">
            <Input name="paymentMethod" defaultValue={record?.paymentMethod ?? ""} maxLength={200} placeholder="微信245，支付宝189" />
          </Field>
        </div>
        <Field label="商品">
          <Textarea
            className="min-h-24"
            name="productSummary"
            defaultValue={record?.productSummary ?? ""}
            maxLength={2000}
            placeholder="无比滴55*2；久光贴10包398"
            required
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="价格/应收">
            <Input min="0" name="saleAmount" step="0.01" type="number" defaultValue={record?.saleAmount ?? ""} />
          </Field>
          <Field label="收款/实收">
            <Input min="0" name="receivedAmount" step="0.01" type="number" defaultValue={record?.receivedAmount ?? ""} />
          </Field>
          <Field label="利润" hint="不填时，按“收款 - 人民币成本”自动计算。">
            <Input name="profitAmount" step="0.01" type="number" defaultValue={record?.profitAmount ?? ""} />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-line bg-white p-4">
        <h2 className="text-base font-semibold text-ink">采购和成本</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="备注">
            <Textarea
              className="min-h-24"
              name="purchaseNote"
              defaultValue={record?.purchaseNote ?? ""}
              maxLength={2000}
              placeholder="亚马逊购入、日元买的、还差2包"
            />
          </Field>
          <Field label="成本明细">
            <Textarea
              className="min-h-24"
              name="costNote"
              defaultValue={record?.costNote ?? ""}
              maxLength={2000}
              placeholder="650*2，780，久光贴2400"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="日元成本/合计">
            <Input min="0" name="costJpy" step="0.01" type="number" defaultValue={record?.costJpy ?? ""} />
          </Field>
          <Field label="人民币成本">
            <Input min="0" name="costCny" step="0.01" type="number" defaultValue={record?.costCny ?? ""} />
          </Field>
        </div>
      </section>

      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}

      <div>
        <Button disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "保存中" : "保存记录"}
        </Button>
      </div>
    </form>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
