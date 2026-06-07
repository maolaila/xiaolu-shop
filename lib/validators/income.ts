import { z } from "zod";

function nullableText(max: number, message: string) {
  return z.preprocess((value) => {
    const text = String(value ?? "").trim();
    return text || null;
  }, z.string().max(max, message).nullable());
}

function optionalMoney(message: string) {
  return z.preprocess((value) => {
    const text = String(value ?? "").trim();
    return text || null;
  }, z.coerce.number().min(0, message).max(999999999, "金额过大").nullable());
}

function optionalSignedMoney() {
  return z.preprocess((value) => {
    const text = String(value ?? "").trim();
    return text || null;
  }, z.coerce.number().min(-999999999, "金额过小").max(999999999, "金额过大").nullable());
}

function defaultRecordDate() {
  return new Date().toISOString().slice(0, 10);
}

export const incomeRecordSchema = z
  .object({
    recordDate: z.preprocess((value) => {
      const text = String(value ?? "").trim();
      return text || defaultRecordDate();
    }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "请选择日期")),
    customerName: nullableText(80, "客户姓名最多 80 个字符"),
    contact: nullableText(120, "电话/微信号最多 120 个字符"),
    paymentMethod: nullableText(200, "支付方式最多 200 个字符"),
    productSummary: z.string().trim().min(1, "商品不能为空").max(2000, "商品最多 2000 个字符"),
    saleAmount: optionalMoney("价格不能小于 0"),
    receivedAmount: optionalMoney("收款不能小于 0"),
    purchaseNote: nullableText(2000, "备注最多 2000 个字符"),
    costNote: nullableText(2000, "成本明细最多 2000 个字符"),
    costJpy: optionalMoney("日元成本不能小于 0"),
    costCny: optionalMoney("人民币成本不能小于 0"),
    profitAmount: optionalSignedMoney()
  })
  .refine((value) => value.customerName || value.contact, {
    message: "客户姓名或电话/微信号至少填一个",
    path: ["customerName"]
  });

export type IncomeRecordInput = z.infer<typeof incomeRecordSchema>;
