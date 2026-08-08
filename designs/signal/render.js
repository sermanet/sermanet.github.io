'use strict';

/* Signal — founder-facing feed. UMA leads; the research record is the
   credential behind it, filterable by thread rather than scrolled. */

const B = require('../_shared/build.js');

const CSS = 'designs/signal/style.css';
const JS = 'designs/signal/app.js';
const FONTS = 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600;700&display=swap';

/* The written one-liner if there is one, else the first paragraph cut short. */
function summarise(project, max) {
  const text = B.plain(project.summary || project.body[0] || '');
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '…';
}

function card(project, themes) {
  const extra = project.media.length > 1 ? `<span class="n-media">${project.media.length}</span>` : '';
  return `      <a class="card" href="#${B.attr(project.id)}" data-themes="${B.attr(project.themes.join(' '))}" aria-label="${B.attr(B.plain(project.title))}, ${project.year}">
        <span class="th">${B.thumb(project)}${extra}</span>
        <span class="in">
          <span class="tg">${B.esc(B.themeLabel(themes, project.themes[0]))}</span>
          <span class="nm">${project.short || project.title}</span>
          <span class="ds">${B.esc(summarise(project, 96))}</span>
          <span class="ft">${[project.year, B.esc(B.plain(project.venue))].filter(Boolean).join(' · ')}</span>
        </span>
      </a>`;
}

module.exports = function render(site) {
  const { profile, themes, highlights, projects } = site;
  const now = profile.now;

  const chips = [{ id: 'all', label: 'All' }].concat(themes)
    .map((t) => `    <button type="button" data-theme="${B.attr(t.id)}" aria-pressed="${t.id === 'all'}">${B.esc(t.label)}</button>`)
    .join('\n');

  const rows = highlights.map(
    (h) => `        <div class="row"><div class="yr">${B.esc(h.year)}</div><div class="bd">${h.body}</div></div>`
  ).join('\n');

  const nav = profile.links.slice(0, 5)
    .map((l) => `      <a href="${B.attr(l.href)}"${B.external(l.href)}>${B.esc(l.label)}</a>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
${B.head(profile, FONTS, '#FAFAF9')}
  <link rel="stylesheet" href="${B.versioned(CSS)}">
${B.THEME_BOOT}
</head>
<body>

<div class="shell">

  <div class="topnav">
    <span class="brand">${B.esc(profile.name)}</span>
    <nav aria-label="Profiles">
      <a href="#feed">Research</a>
      <a href="${B.attr(profile.org.url)}" target="_blank" rel="noopener">${B.esc(profile.org.name)}</a>
${nav}
    </nav>
${B.THEME_TOGGLE}
  </div>

  <header class="hero">
    <div>
      <h1>${B.esc(profile.name)}</h1>
      <p class="lede">${profile.role} at <a href="${B.attr(profile.org.url)}" target="_blank" rel="noopener"><strong>${B.esc(profile.org.name)}</strong></a>. ${profile.formerly}</p>
      <div class="cta">
        <a class="pri" href="${B.attr(now.url)}" target="_blank" rel="noopener">What we're building at ${B.esc(now.org)}</a>
        <a href="#feed">Browse ${projects.length} projects</a>
      </div>
    </div>
    <aside class="now">
      <div class="k">Currently</div>
      <div class="h">${B.esc(now.org)}</div>
      <p class="d">${now.blurb}</p>
      <div class="stats">
        <div><div class="v"><a href="${B.attr(profile.scholarUrl)}" target="_blank" rel="noopener">${B.esc(profile.citations)}</a></div><div class="l">Citations</div></div>
        <div><div class="v">${projects.length}</div><div class="l">Projects</div></div>
        <div><div class="v">${B.esc(B.span(projects))}</div><div class="l">Span</div></div>
      </div>
    </aside>
  </header>

  <section class="strip">
    <details>
      <summary><span class="caret"></span>Selected highlights</summary>
      <div class="rows">
${rows}
      </div>
    </details>
  </section>

  <div class="chips" id="feed">
    <span class="lbl">Filter</span>
${chips}
    <span class="count" id="count">${projects.length} projects</span>
  </div>

  <main class="feed">
${projects.map((p) => card(p, themes)).join('\n')}
    <p class="empty" id="empty" hidden>No projects in this thread.</p>
  </main>

  <footer class="colophon">
    <span>Selected projects and publications — <a href="${B.attr(profile.scholarUrl)}" target="_blank" rel="noopener">full list on Scholar</a>.</span>
    <span>Click a card for the full record.</span>
  </footer>

</div>

${B.records(projects, themes)}

<script src="${B.versioned(B.RUNTIME)}" defer></script>
<script src="${B.versioned(JS)}" defer></script>${B.analytics(profile)}
</body>
</html>
`;
};
