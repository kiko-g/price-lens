/**
 * Seed (or refresh) the dedicated read-only reviewer account.
 *
 * Creates the auth user with email + password, marks the email confirmed, and stamps
 * `profiles.role = 'reviewer'`. Idempotent: re-running updates the password (when
 * REVIEWER_PASSWORD is set) and re-asserts the role.
 *
 * Required env (never commit these; see REVIEWER_ROLE.md):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   REVIEWER_PASSWORD             (>= 12 chars)
 * Optional:
 *   REVIEWER_EMAIL                (default: lince-reviewer@pricelens.dev)
 *   REVIEWER_NAME                 (default: Lince Reviewer)
 *
 * Usage:
 *   pnpm seed:reviewer            # uses .env.local / .env.development.local
 *   pnpm seed:reviewer:prod       # uses .env.production
 *
 * Pre-requisites:
 *   1. Migrations 20260916120000_reviewer_role_enum.sql and 20260916120100_profiles_role_lock.sql applied.
 *   2. Supabase Auth → Sign In / Providers → Email enabled (password sign-in). Signups can stay off:
 *      this script uses the admin API, and /login/reviewer only signs in.
 */

import * as fs from "fs"
import * as path from "path"

for (const envFile of [".env.local", ".env.development.local"]) {
  const envPath = path.join(process.cwd(), envFile)
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8")
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=")
        const value = valueParts.join("=").replace(/^["']|["']$/g, "")
        if (key && !process.env[key]) {
          process.env[key] = value
        }
      }
    }
    break
  }
}

import { createClient, type User } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const REVIEWER_EMAIL = (process.env.REVIEWER_EMAIL || "lince-reviewer@pricelens.dev").trim().toLowerCase()
const REVIEWER_PASSWORD = process.env.REVIEWER_PASSWORD
const REVIEWER_NAME = process.env.REVIEWER_NAME || "Lince Reviewer"
const MIN_PASSWORD_LENGTH = 12

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`)
  process.exit(1)
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  if (!REVIEWER_EMAIL.includes("@")) fail("REVIEWER_EMAIL is not a valid email")

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const findUserByEmail = async (email: string): Promise<User | null> => {
    const perPage = 200
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) fail(`listUsers failed: ${error.message}`)
      const match = data.users.find((u) => u.email?.toLowerCase() === email)
      if (match) return match
      if (data.users.length < perPage) return null
    }
    return null
  }

  log(`Connecting to ${SUPABASE_URL}`)
  log(`Reviewer email: ${REVIEWER_EMAIL}`)

  let user = await findUserByEmail(REVIEWER_EMAIL)

  if (!user) {
    if (!REVIEWER_PASSWORD) fail("REVIEWER_PASSWORD is required to create the reviewer user")
    if (REVIEWER_PASSWORD.length < MIN_PASSWORD_LENGTH) {
      fail(`REVIEWER_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`)
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email: REVIEWER_EMAIL,
      password: REVIEWER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: REVIEWER_NAME },
    })
    if (error || !data.user) fail(`createUser failed: ${error?.message ?? "no user returned"}`)
    user = data.user
    log(`Created auth user ${user.id}`)
  } else {
    log(`Auth user already exists (${user.id})`)
    if (REVIEWER_PASSWORD) {
      if (REVIEWER_PASSWORD.length < MIN_PASSWORD_LENGTH) {
        fail(`REVIEWER_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`)
      }
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: REVIEWER_PASSWORD,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, full_name: REVIEWER_NAME },
      })
      if (error) fail(`updateUserById failed: ${error.message}`)
      log("Password reset and email re-confirmed")
    }
  }

  // The on_auth_user_created trigger inserts the profile with role 'user'; upsert covers
  // the (unlikely) case where it did not fire.
  const { error: roleError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: REVIEWER_NAME, role: "reviewer" }, { onConflict: "id" })
  if (roleError) fail(`Failed to set profiles.role = 'reviewer': ${roleError.message}`)

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single()
  if (readError || !profile) fail(`Failed to read back profile: ${readError?.message ?? "not found"}`)
  if (profile.role !== "reviewer") fail(`profiles.role is '${profile.role}', expected 'reviewer'`)

  log(`Done. ${REVIEWER_EMAIL} → role=${profile.role} (${profile.id})`)
  log("Sign in at /login/reviewer with the email and the password you provided.")
}

main().catch((err) => {
  console.error("[seed-reviewer] Unhandled error:", err)
  process.exit(1)
})
