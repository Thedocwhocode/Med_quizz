import type { ContentPage } from "./content"
import { absolute, escapeHtml, type SeoConfig } from "./seo-config"

const styles = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #1a140b;
  color: #f4efe8;
  font: 16px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-text-size-adjust: 100%;
}
.wrap { max-width: 44rem; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
header { margin-bottom: 3rem; }
.brand {
  display: inline-block; margin-bottom: 2rem; color: #ff9900;
  font-weight: 700; font-size: 1.05rem; text-decoration: none;
}
h1 { margin: 0 0 1.25rem; font-size: clamp(1.9rem, 5vw, 2.6rem); line-height: 1.15; letter-spacing: -0.02em; }
h2 { margin: 3rem 0 1rem; font-size: 1.4rem; line-height: 1.25; letter-spacing: -0.01em; }
h3 { margin: 2rem 0 0.5rem; font-size: 1.05rem; }
p { margin: 0 0 1rem; }
.intro p { color: #d8cfc2; font-size: 1.1rem; }
ul { margin: 0 0 1rem; padding-left: 1.25rem; }
li { margin-bottom: 0.5rem; }
li::marker { color: #ff9900; }
.cta {
  display: inline-block; margin-top: 2.5rem; padding: 0.85rem 1.75rem;
  background: #ff9900; color: #1a140b; border-radius: 0.6rem;
  font-weight: 700; text-decoration: none;
}
.cta:hover { background: #ffad33; }
.faq { margin-top: 1rem; border-top: 1px solid #3a2f20; }
.faq-item { border-bottom: 1px solid #3a2f20; padding: 1.25rem 0; }
.faq-item h3 { margin: 0 0 0.5rem; }
.faq-item p { margin: 0; color: #d8cfc2; }
footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid #3a2f20; color: #9c917f; font-size: 0.9rem; }
footer a { color: #ff9900; }
@media (prefers-reduced-motion: no-preference) { a { transition: color 0.15s, background 0.15s; } }
`

const renderSection = (section: ContentPage["sections"][number]): string => {
  const body = section.body
    .map((text) => `      <p>${escapeHtml(text)}</p>`)
    .join("\n")

  const items = section.items
    ? `      <ul>\n${section.items
        .map((item) => `        <li>${escapeHtml(item)}</li>`)
        .join("\n")}\n      </ul>`
    : ""

  return [`      <h2>${escapeHtml(section.heading)}</h2>`, body, items]
    .filter(Boolean)
    .join("\n")
}

const renderFaq = (page: ContentPage): string => {
  const { faq } = page

  if (faq.length === 0) {
    return ""
  }

  const items = faq
    .map(
      (entry) =>
        `        <div class="faq-item">
          <h3>${escapeHtml(entry.question)}</h3>
          <p>${escapeHtml(entry.answer)}</p>
        </div>`,
    )
    .join("\n")

  return `      <h2>${escapeHtml(page.faqHeading)}</h2>\n      <div class="faq">\n${items}\n      </div>`
}

/** FAQPage markup is what lets Google show these questions directly in the result. */
const renderJsonLd = (
  page: ContentPage,
  config: SeoConfig,
  url: string,
): string => {
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      inLanguage: page.lang,
      ...(url ? { url } : {}),
      ...(config.siteUrl
        ? {
            isPartOf: {
              "@type": "WebSite",
              name: config.siteName,
              url: `${config.siteUrl}/`,
            },
          }
        : {}),
    },
  ]

  if (page.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faq.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
    })
  }

  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  })

  // `</script>` inside JSON would close the tag early; escaping the slash is the standard guard.
  return `<script type="application/ld+json">${json.replace(/<\//gu, "<\\/")}</script>`
}

export const renderContentPage = (
  page: ContentPage,
  config: SeoConfig,
): string => {
  const url = config.siteUrl ? `${config.siteUrl}/${page.slug}` : ""
  const title = `${page.title} | ${config.siteName}`
  const social = config.siteUrl
    ? [
        `    <link rel="canonical" href="${escapeHtml(url)}" />`,
        `    <meta property="og:url" content="${escapeHtml(url)}" />`,
        `    <meta property="og:image" content="${escapeHtml(absolute(config, config.image))}" />`,
      ].join("\n")
    : ""

  return `<!doctype html>
<html lang="${escapeHtml(page.lang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link id="favicon" rel="icon" type="image/svg+xml" href="/icon.svg" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="theme-color" content="#1a140b" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${escapeHtml(config.siteName)}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:locale" content="${escapeHtml(config.locale)}" />
    <meta name="twitter:card" content="summary_large_image" />
${social}
    <style>${styles}</style>
    ${renderJsonLd(page, config, url)}
  </head>
  <body>
    <div class="wrap">
      <header>
        <a class="brand" href="/">${escapeHtml(config.siteName)}</a>
        <h1>${escapeHtml(page.heading)}</h1>
        <div class="intro">
${page.intro.map((text) => `          <p>${escapeHtml(text)}</p>`).join("\n")}
        </div>
      </header>

      <main>
${page.sections.map(renderSection).join("\n\n")}

${renderFaq(page)}

        <a class="cta" href="${escapeHtml(page.cta.href)}">${escapeHtml(page.cta.label)}</a>
      </main>

      <footer>
        <p><a href="/">${escapeHtml(config.siteName)}</a></p>
      </footer>
    </div>
  </body>
</html>
`
}
