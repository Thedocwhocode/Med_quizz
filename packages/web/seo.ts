import type { Plugin } from "vite"

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

const escapeHtml = (value: string): string =>
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

/** `og:locale` uses `pt_BR`, the `lang` attribute uses `pt-BR`. */
const toLangAttribute = (locale: string): string => locale.replace("_", "-")

/** Resolves an asset path against `siteUrl`; social crawlers reject relative image URLs. */
const absolute = (config: SeoConfig, path: string): string =>
  /^https?:\/\//u.test(path) ? path : `${config.siteUrl}${path}`

const buildTags = (config: SeoConfig): string => {
  const title = escapeHtml(config.siteName)
  const description = escapeHtml(config.description)
  const tags = [
    `<meta name="description" content="${description}" />`,
    `<meta name="application-name" content="${title}" />`,
    `<meta name="theme-color" content="#1a140b" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${title}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:locale" content="${escapeHtml(config.locale)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
  ]

  if (!config.indexable) {
    tags.unshift(`<meta name="robots" content="noindex, nofollow" />`)
  }

  if (config.siteUrl) {
    const image = escapeHtml(absolute(config, config.image))

    tags.push(
      `<link rel="canonical" href="${escapeHtml(config.siteUrl)}/" />`,
      `<meta property="og:url" content="${escapeHtml(config.siteUrl)}/" />`,
      `<meta property="og:image" content="${image}" />`,
      `<meta name="twitter:image" content="${image}" />`,
    )
  }

  return tags.map((tag) => `    ${tag}`).join("\n")
}

const buildRobots = (config: SeoConfig): string => {
  if (!config.indexable) {
    return "User-agent: *\nDisallow: /\n"
  }

  // Private routes are crawlable on purpose: nginx answers them with `X-Robots-Tag: noindex`,
  // which a crawler can only read on a URL it is allowed to fetch.
  const lines = ["User-agent: *", "Allow: /"]

  if (config.siteUrl) {
    lines.push("", `Sitemap: ${config.siteUrl}/sitemap.xml`)
  }

  return `${lines.join("\n")}\n`
}

const buildSitemap = (config: SeoConfig): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.siteUrl}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

/**
 * Injects SEO metadata into `index.html` at build time and emits `robots.txt`.
 * Social crawlers (WhatsApp, Telegram, LinkedIn) never run JavaScript, so these
 * tags have to be in the served HTML rather than applied by the app at runtime.
 * A `sitemap.xml` is emitted only when `VITE_SITE_URL` is set, since sitemap
 * entries must be absolute URLs.
 */
export const seo = (
  env: Record<string, string | undefined> = process.env,
): Plugin => {
  const config = resolveSeo(env)

  return {
    name: "razzia-seo",
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html
          .replace(
            /<html([^>]*)\slang="[^"]*"/u,
            `<html$1 lang="${escapeHtml(toLangAttribute(config.locale))}"`,
          )
          .replace(
            /<title>.*?<\/title>/u,
            `<title>${escapeHtml(config.siteName)}</title>`,
          )
          .replace(/\n\s*<\/head>/u, `\n${buildTags(config)}\n  </head>`),
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: buildRobots(config),
      })

      if (config.siteUrl && config.indexable) {
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: buildSitemap(config),
        })
      }
    },
  }
}
