import type { Plugin } from "vite"
import { contentPages } from "./content"
import { renderContentPage } from "./render-page"
import {
  absolute,
  escapeHtml,
  resolveSeo,
  toLangAttribute,
  type SeoConfig,
} from "./seo-config"

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

const buildSitemap = (config: SeoConfig): string => {
  const urls = [
    { loc: `${config.siteUrl}/`, priority: "1.0" },
    ...contentPages.map((page) => ({
      loc: `${config.siteUrl}/${page.slug}`,
      priority: "0.8",
    })),
  ]

  const entries = urls
    .map(
      ({ loc, priority }) =>
        `  <url>
    <loc>${loc}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`
}

/**
 * Injects SEO metadata into `index.html`, emits `robots.txt`, and renders the
 * static content pages -- all at build time.
 *
 * The app is a client-side SPA, and social crawlers (WhatsApp, Telegram,
 * LinkedIn) run no JavaScript at all, so anything they must read has to be in
 * the served HTML rather than applied by the app once it boots. The same holds
 * for the content pages: they are the only indexable text on the site, so they
 * are emitted as complete documents instead of SPA routes.
 *
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

      for (const page of contentPages) {
        this.emitFile({
          type: "asset",
          fileName: `${page.slug}.html`,
          source: renderContentPage(page, config),
        })
      }
    },
  }
}
