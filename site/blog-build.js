// Blog generator: parses Markdown posts under src/blog/posts/,
// renders them through templates in src/blog/, runs the result through
// gulp-file-include so partials still work, and rewrites relative paths
// so nested pages reach assets/* and other site pages correctly.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const slugify = require('slugify');
const fileinclude = require('gulp-file-include');
const Vinyl = require('vinyl');
const { Readable } = require('stream');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
    .use(markdownItAnchor, { permalink: false });

const SRC = 'src';
const POSTS_DIR = path.join(SRC, 'blog', 'posts');
const TEMPLATES_DIR = path.join(SRC, 'blog');
const OUT = 'dist/blog';

const REQUIRED_FIELDS = ['title', 'date', 'excerpt', 'tags', 'image'];

function tagSlug(name) {
    return slugify(name, { lower: true, strict: true });
}

function postSlug(folderName, frontmatterSlug) {
    if (frontmatterSlug) return frontmatterSlug;
    return folderName.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function formatDateDe(date) {
    return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Escape a string for safe interpolation inside a JSON string literal
// (used when injecting into @@include('…', { "key": "{{value}}" }) blocks).
function escapeJsonString(s) {
    return JSON.stringify(String(s)).slice(1, -1);
}

function lookup(ctx, key) {
    return key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), ctx);
}

// Find the matching closing tag for a block opener, accounting for nesting.
// Returns { bodyStart, bodyEnd, closeEnd } where bodyStart..bodyEnd is the block body
// and closeEnd is the index just past the closing tag in `str`.
function findBlockClose(str, openEndIdx, openTag, closeTag) {
    let depth = 1;
    let i = openEndIdx;
    while (i < str.length) {
        const nextOpen = str.indexOf(openTag, i);
        const nextClose = str.indexOf(closeTag, i);
        if (nextClose === -1) {
            throw new Error(`Template error: unbalanced ${openTag} … ${closeTag}`);
        }
        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            i = nextOpen + openTag.length;
        } else {
            depth--;
            if (depth === 0) {
                return { bodyStart: openEndIdx, bodyEnd: nextClose, closeEnd: nextClose + closeTag.length };
            }
            i = nextClose + closeTag.length;
        }
    }
    throw new Error(`Template error: unbalanced ${openTag} … ${closeTag}`);
}

// Process all block tags ({{#each x}}…{{/each}} or {{#if x}}…{{/if}}) with proper nesting.
function processBlocks(str, ctx) {
    const blockRe = /\{\{#(each|if)\s+([\w.]+)\}\}/;
    let result = '';
    let i = 0;
    while (i < str.length) {
        const sub = str.slice(i);
        const m = sub.match(blockRe);
        if (!m) {
            result += sub;
            break;
        }
        const tagStart = i + m.index;
        const tagEnd = tagStart + m[0].length;
        result += str.slice(i, tagStart);

        const closeTag = m[1] === 'each' ? '{{/each}}' : '{{/if}}';
        const { bodyEnd, closeEnd } = findBlockClose(str, tagEnd, '{{#' + m[1], closeTag);
        const body = str.slice(tagEnd, bodyEnd);

        if (m[1] === 'each') {
            const list = lookup(ctx, m[2]);
            if (Array.isArray(list)) {
                for (const item of list) {
                    const childCtx = (item && typeof item === 'object')
                        ? { ...ctx, ...item, this: item }
                        : { ...ctx, this: item };
                    result += render(body, childCtx);
                }
            }
        } else {
            if (lookup(ctx, m[2])) {
                result += render(body, ctx);
            }
        }
        i = closeEnd;
    }
    return result;
}

// Tiny mustache-ish template renderer.
// Supports: {{var}}, {{var.path}}, {{{raw}}}, {{#if x}}…{{/if}}, {{#each xs}}…{{/each}}.
function render(template, ctx) {
    template = processBlocks(template, ctx);
    template = template.replace(/\{\{\{([\w.]+)\}\}\}/g, (_, key) => {
        const v = lookup(ctx, key);
        return v == null ? '' : String(v);
    });
    template = template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
        const v = lookup(ctx, key);
        return v == null ? '' : escapeHtml(String(v));
    });
    return template;
}

// Rewrite top-level relative paths (assets/…, index.html, blog/, favicons, etc.)
// by prepending `prefix`. Already-prefixed (../) and absolute (/, http) paths are
// untouched because they don't match the alternation.
function rewritePaths(html, prefix) {
    if (!prefix) return html;
    const targets = [
        'assets', 'blog',
        'index\\.html', 'kontakt\\.html', 'impressum\\.html', 'datenschutz\\.html',
        'favicon\\.ico', 'favicon-16x16\\.png', 'favicon-32x32\\.png',
        'apple-touch-icon\\.png', 'site\\.webmanifest',
        'android-chrome-192x192\\.png', 'android-chrome-512x512\\.png',
    ].join('|');
    const re = new RegExp(`(\\s(?:href|src|content|action|srcset|data-[\\w-]+)=["'])((?:${targets})(?:[/"'?#]|$))`, 'g');
    return html.replace(re, (_, attr, rest) => `${attr}${prefix}${rest}`);
}

function runFileInclude(content) {
    return new Promise((resolve, reject) => {
        // Virtual file lives at src/blog/_blog_virtual.html so that `../partials/…`
        // includes inside the blog templates resolve to src/partials/…
        const file = new Vinyl({
            contents: Buffer.from(content),
            path: path.resolve(SRC, 'blog', '_blog_virtual.html'),
            base: path.resolve(SRC),
        });
        const stream = new Readable({
            objectMode: true,
            read() { this.push(file); this.push(null); }
        });
        let result;
        stream.pipe(fileinclude({ prefix: '@@', basepath: '@file' }))
            .on('data', f => { result = f.contents.toString(); })
            .on('end', () => resolve(result))
            .on('error', reject);
    });
}

function ensureDir(p) {
    fs.mkdirSync(p, { recursive: true });
}

function copyAssets(srcDir, destDir) {
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name !== 'index.md') {
            fs.copyFileSync(path.join(srcDir, entry.name), path.join(destDir, entry.name));
        }
    }
}

function countDrafts() {
    if (!fs.existsSync(POSTS_DIR)) return 0;
    let n = 0;
    for (const folder of fs.readdirSync(POSTS_DIR)) {
        const mdPath = path.join(POSTS_DIR, folder, 'index.md');
        if (!fs.existsSync(mdPath)) continue;
        const fm = matter(fs.readFileSync(mdPath, 'utf8')).data || {};
        if (fm.draft === true) n++;
    }
    return n;
}

function loadPosts() {
    if (!fs.existsSync(POSTS_DIR)) return [];
    const folders = fs.readdirSync(POSTS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const posts = [];
    for (const folder of folders) {
        const dir = path.join(POSTS_DIR, folder);
        const mdPath = path.join(dir, 'index.md');
        if (!fs.existsSync(mdPath)) continue;

        const raw = fs.readFileSync(mdPath, 'utf8');
        const parsed = matter(raw);
        const fm = parsed.data || {};
        if (fm.draft === true) continue;

        for (const field of REQUIRED_FIELDS) {
            if (fm[field] === undefined || fm[field] === null || fm[field] === '') {
                throw new Error(`[blog] ${folder}/index.md is missing required field "${field}"`);
            }
        }
        if (!fm.author || !fm.author.name) {
            throw new Error(`[blog] ${folder}/index.md is missing author.name`);
        }
        if (!Array.isArray(fm.tags) || fm.tags.length === 0) {
            throw new Error(`[blog] ${folder}/index.md tags must be a non-empty array`);
        }
        const date = new Date(fm.date);
        if (isNaN(date.getTime())) {
            throw new Error(`[blog] ${folder}/index.md has invalid date "${fm.date}"`);
        }
        if (!fs.existsSync(path.join(dir, fm.image))) {
            throw new Error(`[blog] ${folder}/index.md image not found: ${fm.image}`);
        }

        posts.push({
            slug: postSlug(folder, fm.slug),
            dir,
            folder,
            title: fm.title,
            date,
            dateIso: date.toISOString().slice(0, 10),
            dateDisplay: formatDateDe(date),
            author: fm.author,
            excerpt: fm.excerpt,
            tags: fm.tags,
            image: fm.image,
            imageAlt: fm.imageAlt || fm.title,
            content: md.render(parsed.content),
        });
    }

    const seen = new Set();
    for (const p of posts) {
        if (seen.has(p.slug)) {
            throw new Error(`[blog] duplicate slug "${p.slug}"`);
        }
        seen.add(p.slug);
    }

    posts.sort((a, b) => b.date - a.date);
    return posts;
}

function renderTagBadges(tags, prefix) {
    return tags.map(t => {
        const slug = tagSlug(t);
        const href = `${prefix}blog/tag/${slug}/`;
        return `<a class="post-category btn btn-xs bg-primary text-white rounded-pill px-2 me-1" href="${href}">${escapeHtml(t)}</a>`;
    }).join('');
}

function cardCtx(post, prefix) {
    return {
        title: post.title,
        excerpt: post.excerpt,
        href: `${prefix}blog/${post.slug}/`,
        image: `${prefix}blog/${post.slug}/${post.image}`,
        imageAlt: post.imageAlt,
        dateDisplay: post.dateDisplay,
        dateIso: post.dateIso,
        authorName: post.author.name,
        tagsHtml: renderTagBadges(post.tags, prefix),
    };
}

async function buildBlog() {
    const posts = loadPosts();

    // Clean dist/blog so deleted posts and renamed slugs don't leave orphans behind
    if (fs.existsSync(OUT)) {
        fs.rmSync(OUT, { recursive: true, force: true });
    }

    const cardTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, '_card.template.html'), 'utf8');
    const postTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, '_post.template.html'), 'utf8');
    const indexTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, '_index.template.html'), 'utf8');
    const tagTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, '_tag.template.html'), 'utf8');

    const tagMap = new Map();
    for (const p of posts) {
        for (const t of p.tags) {
            if (!tagMap.has(t)) tagMap.set(t, { name: t, slug: tagSlug(t), count: 0 });
            tagMap.get(t).count += 1;
        }
    }
    const allTags = [...tagMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'de-CH'));

    const tagFiltersHtml = (prefix) => allTags.map(t =>
        `<a class="btn btn-sm btn-outline-secondary rounded-pill me-1 mb-1" href="${prefix}blog/tag/${t.slug}/">${escapeHtml(t.name)} <span class="opacity-60">(${t.count})</span></a>`
    ).join('');

    // ---- Posts ----
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const prefix = '../../';
        const prev = posts[i + 1] || null;
        const next = posts[i - 1] || null;
        const related = posts
            .filter(p => p !== post && p.tags.some(t => post.tags.includes(t)))
            .slice(0, 3);

        const ctx = {
            title: post.title,
            titleJson: escapeJsonString(post.title),
            excerpt: post.excerpt,
            excerptJson: escapeJsonString(post.excerpt),
            dateDisplay: post.dateDisplay,
            dateIso: post.dateIso,
            authorName: post.author.name,
            authorRole: post.author.role || '',
            authorBio: post.author.bio || '',
            authorAvatar: post.author.avatar ? `${prefix}assets/images/${post.author.avatar}` : '',
            hasAuthorAvatar: !!post.author.avatar,
            heroImage: `${prefix}blog/${post.slug}/${post.image}`,
            imageAlt: post.imageAlt,
            content: post.content,
            tagsHtml: renderTagBadges(post.tags, prefix),
            hasPrev: !!prev,
            hasNext: !!next,
            prevHref: prev ? `${prefix}blog/${prev.slug}/` : '',
            prevTitle: prev ? prev.title : '',
            nextHref: next ? `${prefix}blog/${next.slug}/` : '',
            nextTitle: next ? next.title : '',
            hasRelated: related.length > 0,
            relatedCards: related.map(r => render(cardTemplate, cardCtx(r, prefix))).join(''),
            blogIndexHref: `${prefix}blog/`,
        };

        let html = render(postTemplate, ctx);
        html = await runFileInclude(html);
        html = rewritePaths(html, prefix);

        const outDir = path.join(OUT, post.slug);
        ensureDir(outDir);
        fs.writeFileSync(path.join(outDir, 'index.html'), html);
        copyAssets(post.dir, outDir);
    }

    // ---- Index ----
    {
        const prefix = '../';
        const ctx = {
            hasPosts: posts.length > 0,
            isEmpty: posts.length === 0,
            cards: posts.map(p => render(cardTemplate, cardCtx(p, prefix))).join(''),
            tagFilters: tagFiltersHtml(prefix),
            blogIndexHref: `${prefix}blog/`,
        };
        let html = render(indexTemplate, ctx);
        html = await runFileInclude(html);
        html = rewritePaths(html, prefix);
        ensureDir(OUT);
        fs.writeFileSync(path.join(OUT, 'index.html'), html);
    }

    // ---- Tag pages ----
    for (const tag of allTags) {
        const prefix = '../../../';
        const tagPosts = posts.filter(p => p.tags.includes(tag.name));
        const ctx = {
            tagName: tag.name,
            tagNameJson: escapeJsonString(tag.name),
            tagCount: tag.count,
            cards: tagPosts.map(p => render(cardTemplate, cardCtx(p, prefix))).join(''),
            tagFilters: tagFiltersHtml(prefix),
            blogIndexHref: `${prefix}blog/`,
        };
        let html = render(tagTemplate, ctx);
        html = await runFileInclude(html);
        html = rewritePaths(html, prefix);
        const outDir = path.join(OUT, 'tag', tag.slug);
        ensureDir(outDir);
        fs.writeFileSync(path.join(outDir, 'index.html'), html);
    }

    const drafts = countDrafts();
    console.log(`[blog] built ${posts.length} post(s), ${allTags.length} tag page(s)${drafts ? `, ${drafts} draft(s) skipped` : ''}`);
}

module.exports = { buildBlog };
