import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * CI guardrail for i18n messages:
 *  1. All keys in `messages/en.json` exist in `messages/pt.json` (and vice versa).
 *  2. ICU placeholders ({name}, {count, plural, ...}, etc.) match across locales.
 *  3. No empty string values.
 *
 * Exits with code 1 on any violation so CI blocks the merge.
 */

type JsonTree = { [key: string]: JsonTree | string }

function flatten(tree: JsonTree, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "string") {
      result[path] = value
    } else if (value && typeof value === "object") {
      Object.assign(result, flatten(value, path))
    }
  }
  return result
}

function extractPlaceholders(value: string): string[] {
  const placeholders = new Set<string>()
  const re = /\{([a-zA-Z0-9_]+)(?:,[^}]*)?\}/g
  let match
  while ((match = re.exec(value)) != null) {
    placeholders.add(match[1])
  }
  return [...placeholders].sort()
}

function extractTags(value: string): string[] {
  const tags = new Set<string>()
  const re = /<([a-zA-Z][a-zA-Z0-9]*)>/g
  let match
  while ((match = re.exec(value)) != null) {
    tags.add(match[1])
  }
  return [...tags].sort()
}

function readMessages(file: string): JsonTree {
  const raw = readFileSync(resolve(file), "utf8")
  return JSON.parse(raw) as JsonTree
}

function main() {
  const en = flatten(readMessages("messages/en.json"))
  const pt = flatten(readMessages("messages/pt.json"))

  const errors: string[] = []

  const enKeys = new Set(Object.keys(en))
  const ptKeys = new Set(Object.keys(pt))

  for (const key of enKeys) {
    if (!ptKeys.has(key)) errors.push(`Missing in pt.json: ${key}`)
  }
  for (const key of ptKeys) {
    if (!enKeys.has(key)) errors.push(`Missing in en.json: ${key}`)
  }

  for (const key of enKeys) {
    if (!ptKeys.has(key)) continue
    const enPh = extractPlaceholders(en[key])
    const ptPh = extractPlaceholders(pt[key])
    if (JSON.stringify(enPh) !== JSON.stringify(ptPh)) {
      errors.push(`Placeholder mismatch at ${key}: en=${JSON.stringify(enPh)} pt=${JSON.stringify(ptPh)}`)
    }
    const enTags = extractTags(en[key])
    const ptTags = extractTags(pt[key])
    if (JSON.stringify(enTags) !== JSON.stringify(ptTags)) {
      errors.push(`Rich-text tag mismatch at ${key}: en=${JSON.stringify(enTags)} pt=${JSON.stringify(ptTags)}`)
    }
  }

  for (const [locale, msgs] of [
    ["en", en],
    ["pt", pt],
  ] as const) {
    for (const [key, value] of Object.entries(msgs)) {
      if (!value || value.trim() === "") errors.push(`Empty value in ${locale}.json at ${key}`)
    }
  }

  if (errors.length > 0) {
    console.error(`[check-messages] ${errors.length} issue(s):`)
    for (const err of errors) console.error(`  - ${err}`)
    process.exit(1)
  }

  const total = Object.keys(en).length
  console.log(`[check-messages] OK — ${total} keys, 2 locales, no mismatches`)
}

main()
