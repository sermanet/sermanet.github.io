'use strict';

/* Helpers shared by every design's render.js.
   Designs differ in layout and styling, not in what a project record is —
   so the record markup lives here and each design's CSS dresses it. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..', '..');

const esc = (s) => String(s).replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => String(s).replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* Strip markup for plain-text contexts: meta description, aria-label, alt. */
const plain = (s) => String(s).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();

const external = (href) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '');

/* GitHub Pages caches assets hard, so stamp each URL with a hash of its
   contents — a redeploy then invalidates only what actually changed. */
function versioned(rel) {
  const hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(root, rel))).digest('hex').slice(0, 8);
  return `/${rel}?v=${hash}`;
}

function themeLabel(themes, id) {
  const t = themes.find((x) => x.id === id);
  return t ? t.label : id;
}

/* Thumbnail for a project. Videos carry data-src so nothing downloads until
   the tile nears the viewport; the #t fragment (added at runtime) paints a
   still frame, standing in for the poster images the repo doesn't have.
   A media item may carry a `preview`: a short, small loop used here, so a
   card never streams a minute-long clip just to animate on hover. */
function thumb(project, opts) {
  const m = project.media[0];
  const alt = attr(plain(project.short || project.title));
  const t = (opts && opts.t) || '0.4';
  if (m.type === 'image') {
    return `<img src="${attr(m.src)}" alt="${alt}" loading="lazy" decoding="async">`;
  }
  return `<video data-src="${attr(m.preview || m.src)}" data-t="${attr(t)}" muted loop playsinline preload="none" aria-label="${alt}"></video>`;
}

function detailMedia(project, indent) {
  const pad = indent || '        ';
  return project.media.map((m) => (m.type === 'image'
    ? `${pad}<img src="${attr(m.src)}" alt="" loading="lazy" decoding="async">`
    : `${pad}<video data-src="${attr(m.src)}" muted loop playsinline controls preload="none"></video>`
  )).join('\n');
}

/* The full record, rendered as a <dialog> whose id is the project's legacy
   anchor — so sermanet.github.io/#robovqa keeps resolving to this project. */
function record(project, themes) {
  const links = project.links
    .map((l) => `        <a href="${attr(l.href)}"${external(l.href)}>${esc(l.label)}</a>`)
    .join('\n');
  const body = project.body.map((p) => `        <p class="bd">${p}</p>`).join('\n');
  /* Longer, abstract-length write-up rendered below the original description,
     never in place of it. Lives in its own field so it stays easy to edit. */
  const extended = (project.extended || [])
    .map((p, i) => `        <p class="bd extended${i === 0 ? ' extended-first' : ''}">${p}</p>`).join('\n');
  const tags = project.themes.map((t) => themeLabel(themes, t)).join(' · ');

  return `  <dialog class="detail" id="${attr(project.id)}" aria-labelledby="${attr(project.id)}-t">
    <div class="detail-head">
      <div class="meta">
        <p class="kicker">${esc(tags)} — ${project.year}</p>
        <h2 id="${attr(project.id)}-t">${project.title}</h2>
      </div>
      <button class="detail-close" type="button" aria-label="Close">&times;</button>
    </div>
    <div class="detail-body">
      <div class="detail-media">
${detailMedia(project)}
      </div>
      <div class="detail-text">
        <div class="detail-links">
${links}
        </div>
${project.authors ? `        <p class="authors">${project.authors}</p>\n` : ''}${project.venue ? `        <p class="venue">${project.venue}</p>\n` : ''}${body}${extended ? '\n' + extended : ''}
      </div>
    </div>
  </dialog>`;
}

function records(projects, themes) {
  return projects.map((p) => record(p, themes)).join('\n');
}

function socialLinks(profile, indent) {
  const pad = indent || '        ';
  return profile.links.map(
    (l) => `${pad}<a href="${attr(l.href)}"${l.title ? ` title="${attr(l.title)}"` : ''}${external(l.href)}>${esc(l.label)}</a>`
  ).join('\n');
}

function description(profile) {
  return `${plain(profile.name)} — ${plain(profile.role)} at ${profile.org.name}, formerly Google DeepMind. ${plain(profile.fields)}`;
}

function span(projects) {
  const years = projects.map((p) => p.year);
  return `${Math.min(...years)}–${Math.max(...years)}`;
}

/* Shared <head> lines: SEO, social cards, and the records runtime. */
function head(profile, fontsHref, themeColor) {
  const d = description(profile);
  return `  <meta charset="utf-8">
  <title>${esc(profile.name)}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${attr(d)}">
  <meta name="theme-color" content="${attr(themeColor)}">

  <meta property="og:title" content="${attr(profile.name)}">
  <meta property="og:type" content="profile">
  <meta property="og:description" content="${attr(d)}">
  <meta property="og:url" content="https://sermanet.github.io/">
  <meta property="og:image" content="https://sermanet.github.io/assets/scifi/scifi_teaser.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(profile.name)}">
  <meta name="twitter:description" content="${attr(d)}">
  <meta name="twitter:image" content="https://sermanet.github.io/assets/scifi/scifi_teaser.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${fontsHref}">`;
}

/* Cookieless traffic counting. Renders nothing until profile.analytics.goatcounter
   is set, so the site never ships a dead beacon. GoatCounter stores no personal
   data and sets no cookies, which is why no consent banner is needed. */
function analytics(profile) {
  const code = profile.analytics && profile.analytics.goatcounter;
  if (!code) return '';
  const url = /^https?:/.test(code) ? code : `https://${code}.goatcounter.com/count`;
  return `\n<script data-goatcounter="${attr(url)}" async src="https://gc.zgo.at/count.js"></script>`;
}

/* Applies a stored theme choice before first paint, so a viewer who picked
   the non-default theme never sees a flash of the other one. Must be inline
   and synchronous in <head>; a deferred script runs far too late. */
const THEME_BOOT = `  <script>(function(){try{var t=localStorage.getItem('theme');` +
  `if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>`;

/* Cycles system -> light -> dark. Rendered with all three icons present; CSS
   shows whichever matches the current mode. */
const THEME_TOGGLE = `      <button class="theme" type="button" id="theme" data-mode="auto" aria-label="Theme: follow system" title="Theme: follow system">
        <svg class="i-auto" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>
        <svg class="i-light" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="i-dark" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      </button>`;

module.exports = {
  esc, attr, plain, external, versioned, THEME_BOOT, THEME_TOGGLE,
  themeLabel, thumb, detailMedia, record, records,
  socialLinks, description, span, head, analytics,
  RUNTIME: 'designs/_shared/records.js'
};
