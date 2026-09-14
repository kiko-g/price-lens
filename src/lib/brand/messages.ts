/**
 * Resolves brand placeholders (`{brand}`, `{brandShort}`, `{brandLegal}`) inside an ICU message tree.
 *
 * Substitution happens once per request when messages are loaded (see `src/i18n/request.ts`), so
 * `useTranslations`/`getTranslations` callers never need to pass the brand name themselves.
 */

const PLACEHOLDER_PATTERN = /\{(brand|brandShort|brandLegal)\}/g

/**
 * Escapes a literal so it survives ICU MessageFormat parsing after substitution.
 * `'` → `''` (literal apostrophe), `{`/`}` → quoted (`'{'`).
 */
export function escapeIcu(value: string): string {
  return value.replace(/'/g, "''").replace(/[{}]/g, (brace) => `'${brace}'`)
}

export function substituteBrandInString(message: string, placeholders: Record<string, string>): string {
  return message.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const value = placeholders[key]
    return value === undefined ? match : escapeIcu(value)
  })
}

type MessageTree = { [key: string]: string | MessageTree }

export function applyBrandToMessages<T extends MessageTree>(messages: T, placeholders: Record<string, string>): T {
  const out: MessageTree = {}
  for (const [key, value] of Object.entries(messages)) {
    out[key] =
      typeof value === "string"
        ? substituteBrandInString(value, placeholders)
        : applyBrandToMessages(value, placeholders)
  }
  return out as T
}
