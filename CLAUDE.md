# code-agenten.ch

## Purpose
Marketing website for **code-agenten.ch** — a sovereign enterprise AI coding platform for Swiss companies. It wraps state-of-the-art LLMs (Claude 3.5, GPT-4o) via an OpenCode wrapper hosted entirely in Switzerland. Target audience: German-speaking CIOs of Swiss SMEs.

## Language & Locale
- All content is in **Swiss High-German** (Schweizerhochdeutsch)
- Use **ss** instead of **ß** (e.g. "grösste" not "größte", "ausschliesslich" not "ausschließlich")
- Locale: `de_CH`

## Directory Structure

```
/template/          # Original Lexend template (reference only, do not modify)
/site/              # Website project root
  src/              # Source files (edit these)
    partials/       # Shared HTML components (@@include directives)
      _head.html    # <head> section with conditional swiper/typed includes
      _mobile-menu.html  # Mobile offcanvas navigation
      _backtotop.html    # Back-to-top + dark mode toggle
      _navbar.html       # Desktop header/navbar
      _footer.html       # Footer section
      _scripts.html      # Footer scripts + schema switcher
    index.html      # Homepage source
    kontakt.html    # Contact page source
    impressum.html  # Imprint page source
    scss/           # SCSS source (theme-three for all pages)
  dist/             # GENERATED — do not edit, run `just build`
    *.html          # Assembled HTML pages
    favicon.ico
    assets/css/     # Compiled CSS + vendor CSS
    assets/js/      # Copied from ../../assets/js
    assets/fonts/   # Copied from ../../assets/fonts
    assets/images/  # Copied from ../../assets/images
  assets/           # Static assets (not built, checked into git)
    css/            # Vendor CSS (unicons, swiper, fonts.css)
    fonts/          # Web fonts
    images/         # Only images referenced by site pages
    js/             # JS libraries, helpers, uni-core framework
  package.json      # Build tooling (Vite, Gulp)
  vite.config.js    # Dev server (serves dist/)
  gulpfile.js
```

## Template System
- Built on the **Lexend** HTML template (Bootstrap + UIKit components)
- CSS framework: Bootstrap with custom SCSS themes
- JS: jQuery, Anime.js, Swiper, ScrollMagic, Typed.js, GSAP
- Component system: uni-core (custom UIKit-like components with `data-uc-*` attributes)
- SCSS is precompiled to CSS via `just css` (uses Dart Sass)

## Build
- First-time setup or after clean: run `just setup` (copies static assets and vendor CSS into dist/)
- After any HTML partial/source changes, run `just html` to assemble pages into dist/
- After any SCSS changes, run `just css` to recompile CSS into dist/assets/css/
- Full rebuild: `just build` (setup + css + html)
- All pages use: `src/scss/theme/theme-three.scss` → `dist/assets/css/theme-three.css`
- Dev server (`npm run dev` from site/) serves from dist/

## Key Conventions
- All pages use `src/scss/theme/theme-three.scss` (teal/blue theme)
- **Edit HTML in `src/`**, never edit files in `dist/` (they are generated)
- Shared components (navbar, footer, etc.) live in `src/partials/` — edit once, applies everywhere
- Variables are passed via `@@include('./partials/_file.html', { "key": "value" })` syntax
- Conditionals use `@@if (context.varName) { ... }` (gulp-file-include)
- Asset paths from HTML files are relative to the page location (pages are at site root, so `assets/...`)
- Dark mode is supported via `dark:` CSS utility classes

## Pages Overview
- **index.html**: Hero → Language reel → Benefits (6 boxes) → CTA → Accordion features → Productivity section → Hiring CTA → Footer
- **kontakt.html**: Hero with contact form → Footer
- **impressum.html**: Breadcrumb → Legal content (imprint + privacy) → Footer

## When Adding Pages
1. Create the new page in `site/src/` using `@@include` for shared partials
2. Reference the original template in `/template/src/main/` for section inspiration
3. Use the same `@@include` partials as existing pages for head, navbar, footer, scripts
4. Add navigation links to `src/partials/_mobile-menu.html`, `_navbar.html`, and `_footer.html`
5. Run `just html` to assemble the page
6. Placeholder images from the template are kept intentionally — they will be replaced later
