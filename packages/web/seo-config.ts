export interface SeoConfig {
  siteUrl: string
  siteName: string
  description: string
  locale: string
  image: string
  indexable: boolean
}

const defaults: SeoConfig = {
  siteUrl: "",
  siteName: "Razzia",
  description:
    "Open-source quiz platform: host live quizzes on your own server, players join from any device with a room code.",
  locale: "en_US",
  image: "/og-image.png",
  indexable: true,
}

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")

/** Treats a blank variable as unset, so an empty value falls back to the default. */
const trimmed = (value: string | undefined): string | undefined => {
  const result = value?.trim()

  return result === "" ? undefined : result
}

/** Strips the trailing slash so `siteUrl + path` never produces a double slash. */
const normalizeUrl = (value: string): string =>
  value.trim().replace(/\/+$/u, "")

/** `og:locale` uses `pt_BR`, the `lang` attribute uses `pt-BR`. */
export const toLangAttribute = (locale: string): string =>
  locale.replace("_", "-")

/**
 * Resolves an asset path against `siteUrl`; social crawlers reject relative
 * image URLs. Joins on exactly one slash, so a path written without a leading
 * one does not produce `https://example.comog-image.png`.
 */
export const absolute = (config: SeoConfig, path: string): string =>
  /^https?:\/\//u.test(path)
    ? path
    : `${config.siteUrl}/${path.replace(/^\/+/u, "")}`

export const resolveSeo = (
  env: Record<string, string | undefined>,
): SeoConfig => ({
  siteUrl: normalizeUrl(trimmed(env.VITE_SITE_URL) ?? defaults.siteUrl),
  siteName: trimmed(env.VITE_SITE_NAME) ?? defaults.siteName,
  description: trimmed(env.VITE_SITE_DESCRIPTION) ?? defaults.description,
  locale: trimmed(env.VITE_SITE_LOCALE) ?? defaults.locale,
  image: trimmed(env.VITE_SITE_IMAGE) ?? defaults.image,
  indexable: env.VITE_SITE_INDEXABLE !== "false",
})
