import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { getSql } from "@/db/client";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";

const bootstrapSettingKey = "admin_bootstrap_used_token";

const adminBootstrapSchema = z.object({
  token: z.string().min(1, "创建密钥不能为空"),
  username: z.string().trim().min(1, "账号不能为空").max(64, "账号最多 64 个字符"),
  password: z.string().min(10, "密码至少 10 位").max(128, "密码最多 128 个字符")
});

export class AdminBootstrapFailure extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

type UsedTokenSetting = {
  tokenHash?: string;
};

export async function createBootstrapAdmin(input: unknown) {
  const setupToken = process.env.ADMIN_SETUP_TOKEN?.trim();
  if (!setupToken || setupToken.length < 16) {
    throw new AdminBootstrapFailure("后台账号创建未启用", 404);
  }

  const parsed = adminBootstrapSchema.parse(input);
  if (!isTokenMatch(parsed.token, setupToken)) {
    throw new AdminBootstrapFailure("创建密钥不正确", 401);
  }

  const tokenHash = hashSetupToken(setupToken);
  const normalizedUsername = parsed.username.toLowerCase();
  const passwordHash = await hashPassword(parsed.password);
  const sql = getSql();

  await sql.begin(async (tx) => {
    const usedRows = await tx<{ value: UsedTokenSetting }[]>`
      select value
      from site_settings
      where key = ${bootstrapSettingKey}
      limit 1
    `;
    if (usedRows[0]?.value?.tokenHash === tokenHash) {
      throw new AdminBootstrapFailure("这个创建密钥已经使用过", 409);
    }

    const existing = await tx<{ id: string }[]>`
      select id
      from users
      where normalized_username = ${normalizedUsername}
      limit 1
    `;
    if (existing.length > 0) {
      throw new AdminBootstrapFailure(`账号 ${parsed.username} 已存在`, 409);
    }

    await tx`
      insert into users (username, normalized_username, password_hash, role, status)
      values (${parsed.username}, ${normalizedUsername}, ${passwordHash}, 'admin', 'active')
    `;
    await tx`
      insert into site_settings (key, value, updated_at)
      values (
        ${bootstrapSettingKey},
        ${tx.json({ tokenHash, username: parsed.username, usedAt: new Date().toISOString() })},
        now()
      )
      on conflict (key) do update
      set value = excluded.value,
          updated_at = now()
    `;
  });

  return { username: parsed.username };
}

function hashSetupToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isTokenMatch(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  return inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer);
}
