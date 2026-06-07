import { NextRequest, NextResponse } from "next/server";

import { jsonError, jsonOk } from "@/server/http";
import {
  AdminMaintenanceFailure,
  applyIncomeRecordsMigration
} from "@/server/services/admin-maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const result = await applyIncomeRecordsMigration(await request.json());
    return jsonOk(result);
  } catch (error) {
    if (error instanceof AdminMaintenanceFailure) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}
