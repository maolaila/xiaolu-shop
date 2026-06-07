import "./load-env";

import bcrypt from "bcryptjs";
import postgres from "postgres";

const bcryptRounds = 12;
const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
const pepper = process.env.PASSWORD_PEPPER ?? "";

type Args = {
  username: string;
  password: string;
};

function usage() {
  return [
    "Usage:",
    "  pnpm admin:create -- --username <admin-name> --password <strong-password>",
    "",
    "Environment:",
    "  DATABASE_URL or DIRECT_DATABASE_URL is required.",
    "  PASSWORD_PEPPER must match the deployed app."
  ].join("\n");
}

function readArg(name: string) {
  const inline = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) {
    return inline.slice(name.length + 3);
  }
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function parseArgs(): Args {
  const username = readArg("username").trim();
  const password = readArg("password");

  if (!username || !password) {
    throw new Error(usage());
  }
  if (username.length > 64) {
    throw new Error("Username must be 64 characters or fewer.");
  }
  if (password.length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }
  if (pepper.length < 16) {
    throw new Error("PASSWORD_PEPPER must be set to at least 16 characters.");
  }
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is required.");
  }

  return { username, password };
}

async function hashPassword(password: string) {
  return bcrypt.hash(`${password}${pepper}`, bcryptRounds);
}

async function main() {
  const { username, password } = parseArgs();
  const normalizedUsername = username.toLowerCase();
  const sql = postgres(databaseUrl!, { max: 1, prepare: false });

  try {
    const existing = await sql<{ id: string; role: string }[]>`
      select id, role
      from users
      where normalized_username = ${normalizedUsername}
      limit 1
    `;
    if (existing.length > 0) {
      throw new Error(`User "${username}" already exists. Choose another username.`);
    }

    const passwordHash = await hashPassword(password);
    await sql`
      insert into users (username, normalized_username, password_hash, role, status)
      values (${username}, ${normalizedUsername}, ${passwordHash}, 'admin', 'active')
    `;

    console.log(`Created admin user: ${username}`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
