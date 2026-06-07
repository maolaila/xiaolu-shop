import { NextRequest, NextResponse } from "next/server";

import { AdminBootstrapFailure, createBootstrapAdmin } from "@/server/services/admin-bootstrap";
import { jsonError, jsonOk } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const admin = await createBootstrapAdmin(await request.json());
    return jsonOk(admin, { status: 201 });
  } catch (error) {
    if (error instanceof AdminBootstrapFailure) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}
