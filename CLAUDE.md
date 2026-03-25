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
/site/              # Live website files
  index.html        # Homepage (based on index-7 + index-5 template sections)
  kontakt.html      # Contact page (based on page-contact template)
  impressum.html    # Imprint & privacy (based on page-terms template)
  favicon.ico
  package.json      # Build tooling (Vite)
  vite.config.js
  gulpfile.js
  assets/
    css/            # Precompiled CSS (unicons, swiper, etc.)
    fonts/          # Web fonts
    images/         # Only images referenced by site pages
    js/             # JS libraries, helpers, uni-core framework
    scss/           # SCSS source (theme-three for homepage, main for subpages)
```

## Template System
- Built on the **Lexend** HTML template (Bootstrap + UIKit components)
- CSS framework: Bootstrap with custom SCSS themes
- JS: jQuery, Anime.js, Swiper, ScrollMagic, Typed.js, GSAP
- Component system: uni-core (custom UIKit-like components with `data-uc-*` attributes)
- SCSS is precompiled to CSS via `just css` (uses Dart Sass)

## Build
- After any SCSS changes, run `just css` to recompile the CSS
- Homepage CSS: `assets/scss/theme/theme-three.scss` → `assets/css/theme-three.css`
- Subpage CSS: `assets/scss/theme/main.scss` → `assets/css/main.css`

## Key Conventions
- Homepage uses `assets/scss/theme/theme-three.scss` (green/teal theme)
- Subpages (contact, imprint) use `assets/scss/theme/main.scss`
- Asset paths from HTML files are relative to the page location (pages are at site root, so `assets/...`)
- All pages share the same navbar, mobile menu, footer, and cookie notice structure
- Dark mode is supported via `dark:` CSS utility classes

## Pages Overview
- **index.html**: Hero → Language reel → Benefits (6 boxes) → CTA → Accordion features → Productivity section → Hiring CTA → Footer
- **kontakt.html**: Hero with contact form → Footer
- **impressum.html**: Breadcrumb → Legal content (imprint + privacy) → Footer

## When Adding Pages
1. Reference the original template in `/template/src/main/` for section inspiration
2. Keep the same head/script structure as existing pages
3. Use consistent navbar and footer (copy from existing pages)
4. Add navigation links to all pages' navbar, mobile menu, and footer
5. Placeholder images from the template are kept intentionally — they will be replaced later
