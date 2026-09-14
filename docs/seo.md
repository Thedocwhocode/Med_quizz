# SEO

Optional. Razzia ships sensible defaults; everything below is configured at **build time** via environment variables.

## Why build time?

The web app is a client-side React SPA. Googlebot does run JavaScript, but it does so in a second, slower indexing pass — and **social crawlers (WhatsApp, Telegram, LinkedIn, Facebook, X, Discord) run none at all**. A `<meta>` tag added by the app after it boots is therefore invisible to them.

So the metadata is injected into `index.html` while Vite builds, not applied by the app at runtime. This is the one part of the app that cannot be configured through `config/branding/` the way theming is.

## Content pages

Metadata makes the site presentable. It does not make it rank -- ranking needs indexable text that answers what someone typed into a search box, and the join screen is a room-code input.

That text lives in `packages/web/content.ts` and is rendered to complete, JavaScript-free HTML documents at build time. One page ships by default, served at `/sobre`.

**Edit that copy.** It is written for a medical-teaching audience as a starting point; generic text is exactly what a search engine discards. Each page defines:

- `slug` -- the URL path (`sobre` is served at `/sobre`)
- `lang` -- BCP 47 language of the copy, e.g. `pt-BR`; it must match what you actually wrote
- `title`, `heading`, `description`, `intro`
- `sections` -- headings with paragraphs and optional bullet lists
- `faqHeading` and `faq` -- emitted as schema.org `FAQPage` markup, which is what lets Google show the questions directly in a result
- `cta` -- the link back into the app

Add a page by appending to the array; it is rendered, listed in `sitemap.xml`, and served at its slug automatically. Nothing else needs changing.

The home screen footer links to `/sobre` via the `common:about` translation key. If you rename the slug, update that link in `packages/web/src/components/Background.tsx`.

More pages on distinct topics beat one page covering everything: each targets a different search, and a page that answers one question well outranks a page that mentions ten.

## What is indexable

Razzia is a live quiz tool, not a content site. Only one route is worth putting in a search index:

| Route                    | Indexed | Why                                                         |
| ------------------------ | ------- | ----------------------------------------------------------- |
| `/`                      | yes     | The join screen — the page a search result should land on   |
| `/manager`, `/manager/*` | no      | Private area, behind a password                             |
| `/party/*`               | no      | Game rooms are ephemeral; indexing them produces dead pages |

The private routes stay **crawlable** and answer with an `X-Robots-Tag: noindex, nofollow` header (see `docker/nginx.conf`). Blocking them in `robots.txt` instead would be counterproductive: a crawler only reads `noindex` on a URL it is allowed to fetch, so a disallowed URL linked from elsewhere can still end up indexed as a bare link.

If you run your own reverse proxy instead of the bundled nginx, replicate that header — see [Reverse Proxy](reverse-proxy.md).

## Variables

| Variable                | Default           | Purpose                                                                                                                             |
| ----------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL`         | _(empty)_         | Public origin, no trailing slash, e.g. `https://quiz.example.com`. Required for `canonical`, `og:url`, `og:image` and `sitemap.xml` |
| `VITE_SITE_NAME`        | `Razzia`          | Page title, `og:site_name`                                                                                                          |
| `VITE_SITE_DESCRIPTION` | _(generic blurb)_ | `<meta name="description">` and `og:description`                                                                                    |
| `VITE_SITE_LOCALE`      | `en_US`           | `og:locale`, and the `<html lang>` fallback before i18n resolves the visitor's language                                             |
| `VITE_SITE_IMAGE`       | `/og-image.png`   | Share preview. Resolved against `VITE_SITE_URL`, or pass a full URL                                                                 |
| `VITE_SITE_INDEXABLE`   | `true`            | Set to `false` for a private instance: emits `noindex` plus a blanket `Disallow: /`                                                 |

Set them in `.env` at the repository root (loaded by `pnpm dev` / `pnpm build`):

```dotenv
VITE_SITE_URL=https://quiz.example.com
VITE_SITE_NAME=My Quiz
VITE_SITE_DESCRIPTION=Live quizzes for our events. Join with a room code.
VITE_SITE_LOCALE=en_US
```

Building the Docker image, pass them as build args:

```bash
docker build \
  --build-arg VITE_SITE_URL=https://quiz.example.com \
  --build-arg VITE_SITE_NAME="My Quiz" \
  -t my-razzia .
```

> The published `ralex91/razzia` image is built without these values, so it carries the defaults. To use your own, build the image from source as above.

## Generated files

`pnpm build` writes into `packages/web/dist/`:

- `robots.txt` — always
- `<slug>.html` — one per entry in `content.ts`, always
- `sitemap.xml` — only when `VITE_SITE_URL` is set and `VITE_SITE_INDEXABLE` is not `false`, since sitemap entries must be absolute URLs

The bundled nginx resolves `/sobre` to `sobre.html` via `try_files $uri $uri.html`. Replicate that if you serve the build with something else.

## Share preview image

Drop a `og-image.png` into `packages/web/public/`. Use **PNG or JPEG at 1200×630** — SVG is not rendered by Facebook, WhatsApp or LinkedIn, so the default `/icon.svg` will not do. Keep it under 8 MB; WhatsApp in particular ignores anything larger.

## After deploying

1. Verify ownership in [Google Search Console](https://search.google.com/search-console) (DNS TXT record is the least fragile method).
2. Submit `https://your-domain/sitemap.xml` under **Sitemaps**.
3. Run the live URL through **URL Inspection → Test live URL** and check the rendered HTML actually contains your content — this is where a broken SPA shows up.
4. Test the share preview with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/); it also reveals what WhatsApp will show.

## A realistic expectation

Meta tags make the site _presentable_ and keep junk out of the index. They do not, on their own, make it _rank_. Ranking needs indexable text that answers what someone typed into Google, and a quiz app's join screen has none — it is a code input box.

If organic search traffic is a goal, the content has to exist somewhere: a landing page describing the tool, or pages that are pre-rendered to static HTML at build time rather than assembled in the browser.
