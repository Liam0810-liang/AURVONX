const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'docs');
const catalog = fs.readFileSync(path.join(root, 'catalog.html'), 'utf8');
const categories = {
  skincare: { label: 'Skincare', title: 'Private Label Skincare Products | AURVONX', description: 'Explore private-label skincare product types by focused subcategory, from cleansing and hydration to tone care and barrier care. Browse individual product briefs from AURVONX in Guangzhou, China.' },
  haircare: { label: 'Haircare', title: 'Private Label Haircare Products | AURVONX', description: 'Explore private-label haircare product types by subcategory, including shampoos, masks, conditioners, oils and scalp care. Browse individual product briefs from AURVONX in Guangzhou, China.' },
  styling: { label: 'Styling', title: 'Private Label Hair Styling Products | AURVONX', description: 'Explore private-label hair styling product types by finish and format, including clays, pastes, waxes, gels, sprays, foams and curl creams from AURVONX in Guangzhou, China.' }
};
const mainStart = catalog.indexOf('<main class="catalog-main">');
if (mainStart < 0) throw new Error('Catalog main element not found');
const header = catalog.slice(0, mainStart);
const headTemplate = catalog.slice(catalog.indexOf('<head>'), catalog.indexOf('</head>') + 7);
const sectionStarts = Object.keys(categories).map((key) => [key, catalog.indexOf(`<section class="catalog-category" id="${key}">`)]);
for (const [key, start] of sectionStarts) if (start < 0) throw new Error(`Missing catalog category ${key}`);

for (let i = 0; i < sectionStarts.length; i++) {
  const [key, start] = sectionStarts[i];
  const nextCategory = sectionStarts[i + 1]?.[1] ?? -1;
  const setsStart = catalog.indexOf('<section class="collection-set-gallery"', start);
  const ends = [nextCategory, setsStart].filter((x) => x > start);
  const end = ends.length ? Math.min(...ends) : catalog.indexOf('</main>', start);
  let section = catalog.slice(start, end).trim();
  section = section.replaceAll('../media/', 'media/');
  const data = categories[key];
  const canonical = `https://www.aurvonx.com/${key}.html`;
  let head = headTemplate
    .replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${data.description}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${data.title}</title>`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${data.title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${data.description}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${data.title}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${data.description}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: data.title, description: data.description, url: canonical, inLanguage: 'en' })}</script>`);
  const nav = header.replace(headTemplate, head).replace(/catalog\.html#(skincare|haircare|styling)/g, '$1.html');
  const intro = `<main class="catalog-main"><p class="eyebrow"><a href="catalog.html">PRODUCT CATALOG</a> · ${data.label.toUpperCase()} · GUANGZHOU, CHINA</p><h1>${data.label} Product Types</h1><p class="lead">Browse every ${data.label.toLowerCase()} product type in this range, organized by focused subcategory. Open a product brief for its intended role, development considerations and project-specific next steps.</p><nav class="category-switcher" aria-label="Beauty product categories"><a${key === 'skincare' ? ' aria-current="page"' : ''} href="skincare.html">Skincare</a><a${key === 'haircare' ? ' aria-current="page"' : ''} href="haircare.html">Haircare</a><a${key === 'styling' ? ' aria-current="page"' : ''} href="styling.html">Styling</a><a href="catalog.html">All product types and sets</a></nav>${section}<p class="category-back-link"><a href="catalog.html">View all product categories and coordinated sets →</a></p></main></body></html>`;
  fs.writeFileSync(path.join(root, `${key}.html`), nav + intro);
}

let sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const key of Object.keys(categories)) {
  const loc = `https://www.aurvonx.com/${key}.html`;
  if (!sitemap.includes(loc)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>2026-09-22</lastmod></url>\n</urlset>`);
}
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);

// Point each top-level navigation item to its focused category page across canonical HTML pages.
function visit(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) visit(full);
    else if (item.name.endsWith('.html')) {
      let html = fs.readFileSync(full, 'utf8');
      const depth = path.relative(root, path.dirname(full)).split(path.sep).filter(Boolean).length;
      const prefix = html.includes('<base href="/">') ? '' : '../'.repeat(depth);
      for (const key of Object.keys(categories)) {
        const pattern = new RegExp(`href="(?:\\.\\.\\/)*catalog\\.html#${key}"`, 'g');
        html = html.replace(pattern, `href="${prefix}${key}.html"`);
      }
      // On the all-categories landing page, make the three routes visible without opening the menu.
      if (path.basename(full) === 'catalog.html' && !html.includes('class="category-switcher"')) {
        const links = '<nav class="category-switcher" aria-label="Browse product categories"><a href="skincare.html">Browse Skincare →</a><a href="haircare.html">Browse Haircare →</a><a href="styling.html">Browse Styling →</a></nav>';
        html = html.replace(/(<p class="lead">[\s\S]*?<\/p>)/, `$1${links}`);
      }
      fs.writeFileSync(full, html);
    }
  }
}
visit(root);
console.log('Built focused skincare, haircare and styling category pages and updated navigation and sitemap.');
