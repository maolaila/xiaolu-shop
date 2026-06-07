import "server-only";

import { getSql } from "@/db/client";
import { incomeRecordSchema, type IncomeRecordInput } from "@/lib/validators/income";

export type IncomeRecordRow = {
  id: string;
  recordDate: string;
  customerName: string | null;
  contact: string | null;
  paymentMethod: string | null;
  productSummary: string;
  saleAmount: string | null;
  receivedAmount: string | null;
  purchaseNote: string | null;
  costNote: string | null;
  costJpy: string | null;
  costCny: string | null;
  profitAmount: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IncomeSummary = {
  recordCount: number;
  saleTotal: string;
  receivedTotal: string;
  costCnyTotal: string;
  profitTotal: string;
  missingReceivedCount: number;
};

export async function getIncomeRecords(params: { q?: string } = {}) {
  const sql = getSql();
  const q = params.q?.trim() || null;
  const filter = sql`
    where (
      ${q}::text is null
      or coalesce(customer_name, '') ilike '%' || ${q} || '%'
      or coalesce(contact, '') ilike '%' || ${q} || '%'
      or coalesce(payment_method, '') ilike '%' || ${q} || '%'
      or product_summary ilike '%' || ${q} || '%'
    )
  `;

  const [summary] = await sql<IncomeSummary[]>`
    select
      count(*)::int as "recordCount",
      coalesce(sum(sale_amount), 0)::text as "saleTotal",
      coalesce(sum(received_amount), 0)::text as "receivedTotal",
      coalesce(sum(cost_cny), 0)::text as "costCnyTotal",
      coalesce(sum(profit_amount), 0)::text as "profitTotal",
      count(*) filter (where received_amount is null)::int as "missingReceivedCount"
    from income_records
    ${filter}
  `;

  const records = await sql<IncomeRecordRow[]>`
    select
      id,
      record_date::text as "recordDate",
      customer_name as "customerName",
      contact,
      payment_method as "paymentMethod",
      product_summary as "productSummary",
      sale_amount::text as "saleAmount",
      received_amount::text as "receivedAmount",
      purchase_note as "purchaseNote",
      cost_note as "costNote",
      cost_jpy::text as "costJpy",
      cost_cny::text as "costCny",
      profit_amount::text as "profitAmount",
      created_at::text as "createdAt",
      updated_at::text as "updatedAt"
    from income_records
    ${filter}
    order by record_date desc, created_at desc
    limit 200
  `;

  return { summary, records };
}

export async function getIncomeRecord(id: string) {
  const sql = getSql();
  const [record] = await sql<IncomeRecordRow[]>`
    select
      id,
      record_date::text as "recordDate",
      customer_name as "customerName",
      contact,
      payment_method as "paymentMethod",
      product_summary as "productSummary",
      sale_amount::text as "saleAmount",
      received_amount::text as "receivedAmount",
      purchase_note as "purchaseNote",
      cost_note as "costNote",
      cost_jpy::text as "costJpy",
      cost_cny::text as "costCny",
      profit_amount::text as "profitAmount",
      created_at::text as "createdAt",
      updated_at::text as "updatedAt"
    from income_records
    where id = ${id}
    limit 1
  `;
  return record ?? null;
}

export async function createIncomeRecord(input: unknown) {
  const parsed = normalizeIncomeRecord(input);
  const sql = getSql();
  const [row] = await sql<{ id: string }[]>`
    insert into income_records (
      record_date, customer_name, contact, payment_method, product_summary,
      sale_amount, received_amount, purchase_note, cost_note, cost_jpy, cost_cny, profit_amount
    )
    values (
      ${parsed.recordDate}, ${parsed.customerName}, ${parsed.contact}, ${parsed.paymentMethod},
      ${parsed.productSummary}, ${amount(parsed.saleAmount)}, ${amount(parsed.receivedAmount)},
      ${parsed.purchaseNote}, ${parsed.costNote}, ${amount(parsed.costJpy)}, ${amount(parsed.costCny)},
      ${amount(parsed.profitAmount)}
    )
    returning id
  `;
  return row.id;
}

export async function updateIncomeRecord(id: string, input: unknown) {
  const parsed = normalizeIncomeRecord(input);
  const sql = getSql();
  await sql`
    update income_records
    set
      record_date = ${parsed.recordDate},
      customer_name = ${parsed.customerName},
      contact = ${parsed.contact},
      payment_method = ${parsed.paymentMethod},
      product_summary = ${parsed.productSummary},
      sale_amount = ${amount(parsed.saleAmount)},
      received_amount = ${amount(parsed.receivedAmount)},
      purchase_note = ${parsed.purchaseNote},
      cost_note = ${parsed.costNote},
      cost_jpy = ${amount(parsed.costJpy)},
      cost_cny = ${amount(parsed.costCny)},
      profit_amount = ${amount(parsed.profitAmount)},
      updated_at = now()
    where id = ${id}
  `;
}

export async function deleteIncomeRecord(id: string) {
  const sql = getSql();
  await sql`delete from income_records where id = ${id}`;
}

function normalizeIncomeRecord(input: unknown): IncomeRecordInput {
  const parsed = incomeRecordSchema.parse(input);
  if (parsed.profitAmount == null && parsed.receivedAmount != null && parsed.costCny != null) {
    return {
      ...parsed,
      profitAmount: Number((parsed.receivedAmount - parsed.costCny).toFixed(2))
    };
  }
  return parsed;
}

function amount(value: number | null) {
  return value == null ? null : value.toFixed(2);
}
