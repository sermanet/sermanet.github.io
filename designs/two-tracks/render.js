'use strict';

/* Two Tracks — building and research side by side. The layout makes the
   claim the old page buried in a subtitle: these are two things at once. */

const B = require('../_shared/build.js');

const CSS = 'designs/two-tracks/style.css';
const JS = 'designs/two-tracks/app.js';
const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&display=swap';

function summarise(project, max) {
  const text = B.plain(project.summary || project.body[0] || '');
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '…';
}

function item(project) {
  return `      <a class="item" href="#${B.attr(project.id)}" data-themes="${B.attr(project.themes.join(' '))}">
        <span class="y">${project.year}</span>
        <span>
          <span class="t">${project.short || project.title}</span>
          <span class="d">${B.esc(summarise(project, 104))}</span>
        </span>
      </a>`;
}

module.exports = function render(site) {
  const { profile, themes, projects } = site;
  const now = profile.now;

  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  /* items[0] is the panel's body, so the list starts after it */
  const buildItems = now.items.slice(1).map(
    (i) => `      <div class="item"><span class="y">›</span><span><span class="t">${B.esc(i.label)}</span><span class="d">${i.body}</span></span></div>`
  ).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
${B.head(profile, FONTS, '#F5F4F0')}
  <link rel="stylesheet" href="${B.versioned(CSS)}">
</head>
<body>

<div class="shell">

  <header class="top">
    <h1>${B.esc(profile.name)}</h1>
    <p class="sub">Two decades of robot learning research, now building a company on it.</p>
    <nav class="social" aria-label="Profiles">
${B.socialLinks(profile, '      ')}
    </nav>
  </header>

  <div class="split">

    <section class="col build">
      <header><span class="dot"></span><h2 class="label">Building</h2><span class="range">Now</span></header>
      <p class="lead">${now.lead}</p>
      <p class="blurb">${now.blurb}</p>
      <div class="panel">
        <div class="k">Currently</div>
        <div class="t">${B.esc(now.org)}</div>
        <p class="d">${now.items[0].body}</p>
      </div>
${buildItems}
      <a class="more" href="${B.attr(now.cta.href)}" target="_blank" rel="noopener">${B.esc(now.cta.label)}</a>
    </section>

    <div class="gutter"></div>

    <section class="col research">
      <header><span class="dot"></span><h2 class="label">Research</h2><span class="range">${B.esc(B.span(projects))}</span></header>
      <p class="lead">Google DeepMind, Google Brain, NYU.</p>
      <p class="blurb">${projects.length} projects and ${B.esc(profile.citations)} citations across vision, robotics and semantic safety. ${profile.formerly}</p>
${featured.map(item).join('\n')}
      <div class="rest" id="rest" hidden>
${rest.map(item).join('\n')}
      </div>
      <button class="more" type="button" id="reveal" aria-expanded="false"
              data-show="All ${projects.length} projects" data-hide="Show fewer">All ${projects.length} projects</button>
    </section>

  </div>

  <footer class="join">
    <p class="cv">The research is why the company is possible; the company is where the research finally has to hold up.</p>
    <p class="note">Full publication list on <a href="${B.attr(profile.scholarUrl)}" target="_blank" rel="noopener">Scholar</a>. Click any project for its record.</p>
  </footer>

</div>

${B.records(projects, themes)}

<script src="${B.versioned(B.RUNTIME)}" defer></script>
<script src="${B.versioned(JS)}" defer></script>${B.analytics(profile)}
</body>
</html>
`;
};
