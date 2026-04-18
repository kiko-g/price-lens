import { getTranslations } from "next-intl/server"

import { siteConfig } from "@/lib/config"
import type { Locale } from "@/i18n/config"
import { isLocale, defaultLocale } from "@/i18n/config"
import { formatPrice } from "@/lib/i18n/format"

interface PriceDropAlertData {
  userName: string
  productName: string
  productBrand: string | null
  storeName: string
  oldPrice: number
  newPrice: number
  changePercent: number
  productUrl: string
  locale?: Locale | string | null
}

function resolveLocale(locale: Locale | string | null | undefined): Locale {
  return isLocale(locale) ? locale : defaultLocale
}

export async function priceDropAlertHtml(data: PriceDropAlertData): Promise<string> {
  const locale = resolveLocale(data.locale)
  const t = await getTranslations({ locale, namespace: "email.priceDrop" })
  const saving = formatPrice(data.oldPrice - data.newPrice, locale)
  const changeText = Math.abs(data.changePercent).toFixed(1)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc;">
  <div style="max-width: 480px; margin: 0 auto; padding: 32px 16px;">
    <div style="background: white; border-radius: 12px; padding: 32px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 4px; font-size: 18px; color: #0f172a;">${t("title")}</h2>
      <p style="margin: 0 0 24px; font-size: 14px; color: #64748b;">${t("greeting", { name: data.userName })}</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #0f172a;">
          ${data.productBrand ? `${data.productBrand} ` : ""}${data.productName}
        </p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">${data.storeName}</p>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <div style="text-align: center; flex: 1;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">${t("was")}</p>
          <p style="margin: 4px 0 0; font-size: 20px; font-weight: 600; color: #94a3b8; text-decoration: line-through;">${formatPrice(data.oldPrice, locale)}</p>
        </div>
        <div style="font-size: 18px; color: #94a3b8;">&rarr;</div>
        <div style="text-align: center; flex: 1;">
          <p style="margin: 0; font-size: 12px; color: #16a34a; text-transform: uppercase;">${t("now")}</p>
          <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #16a34a;">${formatPrice(data.newPrice, locale)}</p>
        </div>
      </div>

      <p style="text-align: center; margin: 0 0 20px; font-size: 13px; color: #16a34a; font-weight: 500;">
        ${t("youSave", { amount: saving, percent: changeText })}
      </p>

      <a href="${data.productUrl}" style="display: block; text-align: center; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
        ${t("viewProduct")}
      </a>
    </div>

    <p style="text-align: center; margin: 16px 0 0; font-size: 11px; color: #94a3b8;">
      ${t("footerReason", {
        site: `<a href="${siteConfig.url}" style="color: #64748b;">${siteConfig.name}</a>`,
        profile: `<a href="${siteConfig.url}/profile" style="color: #64748b;">${t("profileLink")}</a>`,
      })}
    </p>
  </div>
</body>
</html>`
}

export async function priceDropAlertSubject(
  productName: string,
  changePercent: number,
  locale?: Locale | string | null,
): Promise<string> {
  const t = await getTranslations({ locale: resolveLocale(locale), namespace: "email.priceDrop" })
  const pct = Math.abs(changePercent).toFixed(0)
  return t("subject", { name: productName, percent: pct })
}
