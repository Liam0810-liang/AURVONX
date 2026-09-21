const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'docs');
const journal = path.join(root, 'journal');
const media = path.join(root, 'media', 'journal');
const listings = [path.join(root, 'journal.html'), ...Array.from({ length: 8 }, (_, i) => path.join(root, 'journal', `page-${i + 1}.html`))].filter(fs.existsSync);
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const themes = [
  ['#e5efe4', '#174637', '#d99a57'], ['#f6e8dc', '#704735', '#dd805e'], ['#e4ebf2', '#25445c', '#81a996'],
  ['#eee8f1', '#584768', '#d0a66c'], ['#e5ece6', '#244f49', '#d38f79'], ['#f3edda', '#5c5531', '#82a998']
];
function wrap(value, max = 29) {
  const words = value.replace(/&amp;/g, '&').split(/\s+/);
  const lines = []; let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > max && line) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}
function classify(slug, title) {
  const s = `${slug} ${title}`.toLowerCase();
  if (/packag|bottle|jar|pump|tube|airless|label/.test(s)) return 'packaging';
  if (/ingredient|niacinamide|vitamin|ceramide|peptide|retinol|retinal|ectoin|panthenol|allantoin|hyaluron|salicylic|bakuchiol|squalane|caffeine|biotin|keratin|amino|collagen|acid|inci/.test(s)) return 'ingredient';
  if (/ vs | versus |compare|comparison|difference|choose between/.test(` ${s} `)) return 'comparison';
  if (/cost|budget|market|trend|forecast|calculate|data|survey|demand|margin|price|launch/.test(s)) return 'data';
  if (/workflow|testing|test|stability|sample|checklist|brief|timeline|process|compliance|claim/.test(s)) return 'workflow';
  return 'product';
}
function molecule(c) {
  return `<g stroke="${c[1]}" stroke-width="7" opacity=".72"><path d="M834 256L966 206 1068 292 1015 408 875 405Z M966 206L1010 115 M1068 292L1145 262" fill="none"/><g fill="${c[2]}" stroke="#fff" stroke-width="5"><circle cx="834" cy="256" r="34"/><circle cx="966" cy="206" r="39"/><circle cx="1068" cy="292" r="32"/><circle cx="1015" cy="408" r="36"/><circle cx="875" cy="405" r="29"/><circle cx="1010" cy="115" r="26"/><circle cx="1145" cy="262" r="24"/></g></g><text x="820" y="500" class="label">INGREDIENT PROFILE</text><rect x="820" y="524" width="300" height="14" rx="7" fill="#fff"/><rect x="820" y="524" width="212" height="14" rx="7" fill="${c[2]}"/><text x="820" y="582" class="small">Identity · Compatibility · Evidence</text>`;
}
function packs(c, category) {
  const label = category === 'Haircare' ? 'HAIR CARE FORMAT' : category === 'Styling' ? 'STYLING FORMAT' : 'SKINCARE FORMAT';
  return `<g stroke="${c[1]}" stroke-width="5"><rect x="858" y="242" width="126" height="280" rx="24" fill="#fff"/><rect x="894" y="195" width="54" height="48" rx="9" fill="${c[1]}"/><rect x="1030" y="303" width="142" height="216" rx="23" fill="#fff"/><rect x="1051" y="279" width="100" height="27" rx="8" fill="${c[1]}"/><path d="M879 362h84 M1050 387h102" stroke="${c[2]}" stroke-width="13"/></g><text x="885" y="430" class="tiny">AURVONX</text><text x="1045" y="444" class="tiny">AURVONX</text><text x="822" y="590" class="label">${label}</text><text x="822" y="630" class="small">Texture · Use · Dispensing</text>`;
}
function chart(c) {
  return `<path d="M824 505V210H1167" fill="none" stroke="${c[1]}" stroke-width="5" opacity=".6"/><g fill="${c[2]}"><rect x="858" y="390" width="54" height="115" rx="8"/><rect x="944" y="320" width="54" height="185" rx="8"/><rect x="1030" y="258" width="54" height="247" rx="8"/><rect x="1116" y="215" width="42" height="290" rx="8"/></g><path d="M858 340Q925 350 971 275T1085 240L1155 167" fill="none" stroke="${c[1]}" stroke-width="8"/><g fill="#fff" stroke="${c[1]}" stroke-width="6"><circle cx="858" cy="340" r="11"/><circle cx="971" cy="275" r="11"/><circle cx="1085" cy="240" r="11"/><circle cx="1155" cy="167" r="11"/></g><text x="822" y="570" class="label">BUYER DECISION MAP</text><text x="822" y="610" class="small">Market · Position · Product fit</text>`;
}
function comparison(c) {
  return `<rect x="810" y="192" width="174" height="330" rx="18" fill="#fff" stroke="#d5ded4" stroke-width="4"/><rect x="1004" y="192" width="174" height="330" rx="18" fill="#fff" stroke="#d5ded4" stroke-width="4"/><text x="839" y="246" class="label">OPTION A</text><text x="1032" y="246" class="label">OPTION B</text><path d="M846 292h102M846 322h82M846 352h94" stroke="${c[2]}" stroke-width="12" stroke-linecap="round"/><path d="M1030 292h116M1030 322h77M1030 352h102" stroke="${c[1]}" stroke-width="12" stroke-linecap="round"/><circle cx="897" cy="438" r="30" fill="${c[2]}" opacity=".25"/><circle cx="1091" cy="438" r="30" fill="${c[1]}" opacity=".18"/><text x="822" y="582" class="label">COMPARE THE BRIEF</text><text x="822" y="622" class="small">Format · Feel · Customer · Market</text>`;
}
function flow(c) {
  return `<path d="M850 265H1148M850 390H1148M850 515H1148" stroke="${c[1]}" stroke-width="5" opacity=".3"/><g fill="#fff" stroke="${c[1]}" stroke-width="5"><circle cx="858" cy="265" r="37"/><circle cx="954" cy="390" r="37"/><circle cx="1050" cy="265" r="37"/><circle cx="1146" cy="390" r="37"/></g><g fill="${c[2]}" font-family="Arial,sans-serif" font-size="28" font-weight="700" text-anchor="middle"><text x="858" y="275">01</text><text x="954" y="400">02</text><text x="1050" y="275">03</text><text x="1146" y="400">04</text></g><rect x="835" y="485" width="317" height="42" rx="21" fill="${c[2]}" opacity=".18"/><text x="822" y="583" class="label">FROM BRIEF TO REVIEW</text><text x="822" y="623" class="small">Scope · Sample · Check · Confirm</text>`;
}
function packaging(c) {
  return `<g stroke="${c[1]}" stroke-width="5" fill="#fff"><path d="M810 262h94l15 258h-124z"/><rect x="833" y="220" width="48" height="42" rx="8" fill="${c[1]}"/><rect x="956" y="300" width="115" height="218" rx="18"/><path d="M982 300v-35h63v35" fill="${c[1]}"/><rect x="1102" y="352" width="92" height="166" rx="36"/><path d="M1122 352v-37h52v37" fill="${c[1]}"/></g><path d="M818 386h82M972 385h83M1113 416h70" stroke="${c[2]}" stroke-width="13"/><text x="822" y="579" class="label">PACK FORMAT STUDY</text><text x="822" y="619" class="small">Bottle · Jar · Tube · Dispensing</text>`;
}
function makeCover(slug, title, category, index) {
  const c = themes[index % themes.length]; const kind = classify(slug, title); const lines = wrap(title);
  const heading = lines.map((line, i) => `<text x="72" y="${252 + i * 58}" class="heading">${esc(line)}</text>`).join('');
  const visual = kind === 'ingredient' ? molecule(c) : kind === 'packaging' ? packaging(c) : kind === 'comparison' ? comparison(c) : kind === 'data' ? chart(c) : kind === 'workflow' ? flow(c) : packs(c, category);
  const tag = kind.toUpperCase().replace('COMPARISON', 'A / B COMPARISON');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(tag)} visual guide for ${esc(title)}.</desc><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c[0]}"/><stop offset="1" stop-color="#fbfaf5"/></linearGradient></defs><style>.heading{font:700 47px Georgia,serif;fill:${c[1]}}.label{font:700 18px Arial,sans-serif;letter-spacing:2px;fill:${c[1]}}.small{font:20px Arial,sans-serif;fill:#5c6d62}.tiny{font:700 13px Arial,sans-serif;letter-spacing:2px;fill:${c[1]}}</style><rect width="1200" height="750" fill="url(#bg)"/><path d="M0 670Q228 588 429 672T835 653T1200 646V750H0Z" fill="#fff" opacity=".57"/><circle cx="1103" cy="100" r="206" fill="${c[2]}" opacity=".12"/><text x="72" y="107" class="label">AURVONX JOURNAL · ${esc(category.toUpperCase())}</text><text x="72" y="164" class="small">${esc(tag)} · PRODUCT DEVELOPMENT</text>${heading}<path d="M72 488h575" stroke="${c[2]}" stroke-width="5"/><text x="72" y="546" class="small">A practical visual guide for brand buyers</text><text x="72" y="590" class="small">Review the brief, evidence and market fit</text><rect x="776" y="130" width="450" height="535" rx="22" fill="#fff" opacity=".55"/>${visual}<text x="72" y="704" class="label" font-size="15">AURVONX · PRIVATE LABEL &amp; OEM / ODM</text></svg>`;
}

const cards = new Map();
for (const file of listings) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(<a class="card journal-index-card" href="([^"]+)">)([\s\S]*?)(<\/a>)/g, (whole, open, href, inside, close) => {
    const slug = path.basename(href, '.html');
    const title = ((inside.match(/<h2>([\s\S]*?)<\/h2>/i) || [])[1] || slug).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    const category = ((inside.match(/<span class="code">([^<]+)/i) || [])[1] || 'Product guide').replace(/&amp;/g, '&');
    cards.set(slug, { title, category });
    inside = inside.replace(/(<img\s+src="[^"]+\.svg"\s+alt=")[^"]*(")/i, `$1${esc(`${title} ${category.toLowerCase()} visual guide`)}$2`);
    return open + inside + close;
  });
  fs.writeFileSync(file, html);
}

let updated = 0;
for (const [slug, item] of cards) {
  const canonical = path.join(journal, `${slug}.html`);
  if (!fs.existsSync(canonical)) continue;
  let html = fs.readFileSync(canonical, 'utf8');
  const pageTitle = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || item.title).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
  const category = /haircare/i.test(item.category) ? 'Haircare' : /styling/i.test(item.category) ? 'Styling' : /skincare/i.test(item.category) ? 'Skincare' : item.category;
  const svg = makeCover(slug, item.title, category, updated);
  fs.writeFileSync(path.join(media, `${slug}.svg`), svg);
  html = html.replace(/(<figure class="page-visual journal-concept-hero">\s*<img\s+src=")[^"]+/i, `$1/media/journal/${slug}.svg`)
    .replace(/(<figure class="page-visual journal-concept-hero">\s*<img[^>]*alt=")[^"]*/i, `$1${esc(`${pageTitle} ${category.toLowerCase()} visual guide`)}`)
    .replace(/(<figure class="journal-cover"><img\s+src=")[^"]+/i, `$1/media/journal/${slug}.svg`)
    .replace(/(<figure class="journal-cover"><img[^>]*alt=")[^"]*/i, `$1${esc(`${pageTitle} ${category.toLowerCase()} visual guide`)}`)
    .replace(/(<meta property="og:image" content=")[^"]+/i, `$1https://www.aurvonx.com/media/journal/${slug}.svg`)
    .replace(/(<meta name="twitter:image" content=")[^"]+/i, `$1https://www.aurvonx.com/media/journal/${slug}.svg`)
    .replace(/("image":\s*")[^"]+/i, `$1https://www.aurvonx.com/media/journal/${slug}.svg`);
  fs.writeFileSync(canonical, html);
  updated++;
}
console.log(`Refreshed ${updated} unique editorial covers and ${cards.size} listing image descriptions.`);
