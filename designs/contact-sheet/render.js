'use strict';

/* Contact Sheet — media-first grid on a dark ground.
   The videos are the page; the chrome gets out of the way. */

const B = require('../_shared/build.js');

const CSS = 'designs/contact-sheet/style.css';
const JS = 'designs/contact-sheet/app.js';
const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter+Tight:wght@400;500;600;700&display=swap';

function tile(project, themes) {
  const extra = project.media.length > 1 ? `<span class="n-media">${project.media.length}</span>` : '';
  return `      <a class="tile" href="#${B.attr(project.id)}" data-themes="${B.attr(project.themes.join(' '))}" aria-label="${B.attr(B.plain(project.title))}, ${project.year}">
        ${B.thumb(project)}
        <span class="scrim"></span>${extra}
        <span class="label">
          <span class="tag">${B.esc(B.themeLabel(themes, project.themes[0]))}</span>
          <span class="nm">${project.short || project.title}</span>
          <span class="yr">${project.year}</span>
        </span>
      </a>`;
}

module.exports = function render(site) {
  const { profile, themes, highlights, projects } = site;

  const filters = [{ id: 'all', label: 'All' }].concat(themes)
    .map((t) => `    <button type="button" data-theme="${B.attr(t.id)}" aria-pressed="${t.id === 'all'}">${B.esc(t.label)}</button>`)
    .join('\n');

  const rows = highlights.map(
    (h) => `      <div class="row"><div class="yr">${B.esc(h.year)}</div><div class="bd">${h.body}</div></div>`
  ).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
${B.head(profile, FONTS, '#0E0F12')}
  <link rel="stylesheet" href="${B.versioned(CSS)}">
</head>
<body>

<div class="shell">

  <header class="mast">
    <div>
      <h1>${B.esc(profile.name)}</h1>
      <p class="role">${profile.role} at <a href="${B.attr(profile.org.url)}" target="_blank" rel="noopener"><strong>${B.esc(profile.org.name)}</strong></a>. ${profile.fields}</p>
      <p class="about">${profile.formerly}</p>
    </div>
    <div class="mast-side">
      <div class="figures">
        <div><div class="v"><a href="${B.attr(profile.scholarUrl)}" target="_blank" rel="noopener">${B.esc(profile.citations)}</a></div><div class="l">Citations</div></div>
        <div><div class="v">${projects.length}</div><div class="l">Projects</div></div>
        <div><div class="v">${B.esc(B.span(projects))}</div><div class="l">Span</div></div>
      </div>
      <nav class="social" aria-label="Profiles">
${B.socialLinks(profile)}
      </nav>
    </div>
  </header>

  <details class="highlights">
    <summary><span class="caret"></span>Selected highlights <span class="hint">${highlights.length} entries, 2005–2025</span></summary>
    <div class="rows">
${rows}
    </div>
  </details>

  <div class="filters">
    <span class="lbl">Filter</span>
${filters}
    <span class="count" id="count">${projects.length} projects</span>
  </div>

  <main class="sheet" id="sheet">
${projects.map((p) => tile(p, themes)).join('\n')}
    <p class="empty" id="empty" hidden>No projects in this thread.</p>
  </main>

  <footer class="colophon">
    <span>Selected projects and publications — <a href="${B.attr(profile.scholarUrl)}" target="_blank" rel="noopener">full list on Scholar</a>.</span>
    <span>Hover a frame to play it; click for the record.</span>
  </footer>

</div>

${B.records(projects, themes)}

<script src="${B.versioned(B.RUNTIME)}" defer></script>
<script src="${B.versioned(JS)}" defer></script>${B.analytics(profile)}
</body>
</html>
`;
};
