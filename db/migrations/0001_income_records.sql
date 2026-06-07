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
