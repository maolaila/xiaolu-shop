import "server-only";

import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { getSql } from "@/db/client";

const incomeRecordsMigrationName = "0001_income_records.sql";
const incomeRecordsMigrationSql = `
create table if not exists income_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null default current_date,
  customer_name text check (customer_name is null or char_length(customer_name) <= 80),
  contact text check (contact is null or char_length(contact) <= 120),
  payment_method text check (payment_method is null or char_length(payment_method) <= 200),
  product_summary text not null check (char_length(product_summary) between 1 and 2000),
  sale_amount numeric(12,2) check (sale_amount is null or sale_amount >= 0),
  received_amount numeric(12,2) check (received_amount is null or received_amount >= 0),
  purchase_note text check (purchase_note is null or char_length(purchase_note) <= 2000),
  cost_note text check (cost_note is null or char_length(cost_note) <= 2000),
  cost_jpy numeric(12,2) check (cost_jpy is null or cost_jpy >= 0),
  cost_cny numeric(12,2) check (cost_cny is null or cost_cny >= 0),
  profit_amount numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists income_records_record_date_idx on income_records(record_date desc);
create index if not exists income_records_created_at_idx on income_records(created_at desc);
`;

const maintenanceSchema = z.object({
  token: z.string().min(1, "维护密钥不能为空")
});

export class AdminMaintenanceFailure extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export async function applyIncomeRecordsMigration(input: unknown) {
  const maintenanceToken = process.env.ADMIN_MAINTENANCE_TOKEN?.trim();
  if (!maintenanceToken || maintenanceToken.length < 16) {
    throw new AdminMaintenanceFailure("后台维护未启用", 404);
  }

  const parsed = maintenanceSchema.parse(input);
  if (!isTokenMatch(parsed.token, maintenanceToken)) {
    throw new AdminMaintenanceFailure("维护密钥不正确", 401);
  }

  const sql = getSql();
  return sql.begin(async (tx) => {
    const before = await tx<{ exists: boolean }[]>`
      select to_regclass('public.income_records') is not null as "exists"
    `;

    await tx`
      create table if not exists _lc_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `;
    await tx.unsafe(incomeRecordsMigrationSql);
    await tx`
      insert into _lc_migrations (name)
      values (${incomeRecordsMigrationName})
      on conflict (name) do nothing
    `;

    return { applied: !before[0]?.exists, migration: incomeRecordsMigrationName };
  });
}

function isTokenMatch(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  return inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer);
}
