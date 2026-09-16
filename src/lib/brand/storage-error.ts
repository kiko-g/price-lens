export function brandStorageError(error: unknown): Error {
  const fields = error && typeof error === "object" ? (error as Record<string, unknown>) : {}
  const message = [
    fields.message,
    fields.error_description,
    fields.error,
    fields.details,
    typeof error === "string" ? error : null,
  ].find((value): value is string => typeof value === "string" && value.trim().length > 0)
  if (fields.code === "42P01" || fields.code === "PGRST205") {
    return new Error(
      "Brand storage is not set up. Apply supabase/migrations/20260915222554_app_settings.sql to this environment's database.",
    )
  }
  return new Error(
    `Brand storage unavailable: ${message ?? "the database did not return an error description. Check the Supabase connection and server credentials."}`,
  )
}
