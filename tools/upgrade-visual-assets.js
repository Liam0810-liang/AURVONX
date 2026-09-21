const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'docs');
const source = path.resolve(__dirname,'..','archive','legacy-site-visuals','generated-source');
const renders = {
  'curl-definition-gel':'exec-4c3326fc-a579-43b3-b57f-ab8d8045154a.png',
  'curl-shaping-cream':'exec-afa14495-6502-4ccb-8e48-ece388686f17.png',
  'even-glow-body-lotion':'exec-fac624e9-1009-4095-a631-6e21329ced67.png',
  'fresh-volume-shampoo':'exec-2c6e51d4-73db-479a-a330-a28a4633fc3d.png',
  'hair-loss-scalp-care-project':'exec-0b494910-ce7b-444d-8b84-4aeec78cf49f.png',
  'heat-styling-prep-serum':'exec-9da39582-2b1d-469d-beef-165c67847f4a.png',
  'non-aerosol-dry-shampoo-powder':'exec-60dd8156-85ce-4a80-a30f-fd8cc744cfb7.png',
  'protein-care-hair-mask':'exec-15473525-1aa6-4f98-9a6a-a612c846ab5b.png',
  'pump-hold-spray':'exec-2bfeb364-385d-474c-bdf1-71887efef1af.png',
  'root-lift-foam':'exec-e8a96a1c-bfd4-4f30-9602-da63fd9bdf1f.png',
  'scalp-comfort-serum':'exec-01ad1dee-a5cb-4cdf-bff0-fee3aad29579.png',
  'scalp-refining-essence':'exec-ec87301a-933f-44c4-996d-aca7d311b9cb.png',
  'smooth-ends-serum':'exec-c3af4c42-9343-4c09-af3c-48b3ac50b594.png',
  'squalane-light-hair-oil':'exec-a62daf8c-bd88-44c1-9e1f-ecc5fb92f83f.png',
  'strength-leave-in-milk':'exec-71a3cd3d-0687-4ca8-99b6-d69774ac1982.png',
  'strong-texture-clay':'exec-cb1e99ab-5a55-4658-85c6-f573c5a66a23.png',
  'styling-mousse-project':'exec-33527e3c-4d44-4f24-847c-a733670f4173.png'
};

const outDir = path.join(root, 'media', 'catalog', 'product-renders');
fs.mkdirSync(outDir, { recursive: true });
for (const [slug, file] of Object.entries(renders)) {
  const from = path.join(source, file);
  if (!fs.existsSync(from)) throw new Error(`Missing generated image ${file}`);
  fs.copyFileSync(from, path.join(outDir, `${slug}.png`));
}

// Replace old conceptual SVGs in every active product route and metadata field.
const productsDir = path.join(root, 'products');
const productDetails = [];
for (const file of fs.readdirSync(productsDir).filter(name => name.endsWith('.html'))) {
  const slug = file.slice(0, -5);
  const render = renders[slug];
  if (!render) continue;
  const filename = `${slug}.png`;
  const target = `media/catalog/product-renders/${filename}`;
  const page = path.join(productsDir, file);
  let html = fs.readFileSync(page, 'utf8');
  html = html.replaceAll(`media/product-concepts/${slug}.svg`, target)
    .replace(/<source type="image\/webp" srcset="([^\"]+\.png)">/g, '<source type="image/png" srcset="$1">');
  html = html.replace(/<source type="image\/webp" srcset="\.\.\/media\/catalog\/product-renders\/([^\"]+)\.webp">/g,
    (_m, name) => `<source type="image/png" srcset="../media/catalog/product-renders/${name}.png">`);
  fs.writeFileSync(page, html);
  productDetails.push(slug);
}

// Update archived route aliases and category grids as well as canonical detail pages.
function updateLegacyVisualReferences(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) { updateLegacyVisualReferences(file); continue; }
    if(!entry.name.endsWith('.html')) continue;
    let html=fs.readFileSync(file,'utf8'); let changed=false;
    for(const [slug] of Object.entries(renders)) {
      const old=`media/product-concepts/${slug}.svg`, next=`media/catalog/product-renders/${slug}.png`;
      if(html.includes(old)){html=html.replaceAll(old,next);changed=true;}
    }
    html=html.replace(/<source type="image\/webp" srcset="([^"]*product-renders\/[^"]+\.png)">/g,(_m,url)=>{changed=true;return `<source type="image/png" srcset="${url}">`;});
    html=html.replace(/media\/journal\/([a-z0-9-]+)\.svg/gi,(_m,slug)=>{
      const png=path.join(root,'media','journal',`${slug}.png`);
      if(fs.existsSync(png)){changed=true;return `media/journal/${slug}.png`;}
      return _m;
    });
    if(changed)fs.writeFileSync(file,html);
  }
}
updateLegacyVisualReferences(root);

// The catalog's product cards already contain each product's unique catalogue photograph.
let catalog = fs.readFileSync(path.join(root, 'catalog.html'), 'utf8');
for (const [slug] of Object.entries(renders)) {
  const href = `products/${slug}.html`;
  const re = new RegExp(`(<a class="category-product-card" href="${href}">[\\s\\S]*?<img src=")[^"]+`);
  const srcset = new RegExp(`(<a class="category-product-card" href="${href}">[\\s\\S]*?<source type="image/webp" srcset=")[^"]+`);
  const replacement = `media/catalog/product-renders/${slug}.png`;
  catalog = catalog.replace(re, `$1${replacement}`).replace(srcset, `$1${replacement}`);
}
catalog = catalog.replace(/<source type="image\/webp" srcset="([^"]+product-renders\/[^\"]+\.png)">/g, '<source type="image/png" srcset="$1">');
fs.writeFileSync(path.join(root, 'catalog.html'), catalog);

// Rebuild journal card/hero artwork from distinct, relevant product photography.
const cardPattern = /<a class="card journal-index-card" href="([^"]+)">([\s\S]*?)<\/a>/g;
const articleMeta = [];
for (const listing of [path.join(root, 'journal.html'), ...Array.from({length:8},(_,i)=>path.join(root,'journal',`page-${i+1}.html`))]) {
  if (!fs.existsSync(listing)) continue;
  let html = fs.readFileSync(listing, 'utf8');
  html = html.replace(cardPattern, (whole, href, body) => {
    const slug = path.basename(href, '.html');
    const title = ((body.match(/<h2>([\s\S]*?)<\/h2>/i) || [])[1] || slug).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'");
    const category = ((body.match(/<span class="code">([^<]+)/i) || [])[1] || '').toUpperCase();
    articleMeta.push({ slug, title, category });
    return whole;
  });
  fs.writeFileSync(listing, html);
}

const productGroups = {
 skincare:new Set(['brightening','even-tone','fine-lines','blemish-care','barrier-care','hydration']),
 haircare:new Set(['shampoo','hair-mask','conditioner','hair-oil','hair-serum','scalp-serum','breakage-care','hair-growth-projects']),
 styling:new Set(['clay-paste','wax-pomade','styling-gel','styling-spray','styling-foam','curl-cream','powder-dry-shampoo'])
};
const catalogCards = [...catalog.matchAll(/<a class="category-product-card" href="products\/([^"/]+)\.html">([\s\S]*?)<\/a>/g)].map(([,slug,body]) => {
  const title = ((body.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i)||[])[1]||slug).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&');
  const parent = body.match(/media\/catalog\/product-renders\/([^" ]+)\.png/) ? 'RENDER' : '';
  const img = ((body.match(/<img src="([^"]+)/)||[])[1]||'').replace(/^\//,'');
  const detail = fs.readFileSync(path.join(productsDir,`${slug}.html`),'utf8');
  const series = (detail.match(/class="crumb"[\s\S]*?href="\.\.\/series\/([^"/]+)\.html"/)||[])[1]||'';
  const category = Object.entries(productGroups).find(([,set])=>set.has(series))?.[0]?.toUpperCase()||'SKINCARE';
  return {slug,title,img,category,parent};
});
const stop = new Set('private label product project oem odm beauty care guide what how vs the for with from into your using choosing compare best a an and of to in on'.split(' '));
const terms = value => new Set(value.toLowerCase().replace(/&amp;/g,' ').replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(t=>t.length>2&&!stop.has(t)));
const score = (title, product) => { const a=terms(title), b=terms(`${product.slug} ${product.title}`); let n=0; for(const t of a)if(b.has(t))n+=4; if(/ingredient|vitamin|ceramide|peptide|retinol|niacinamide|ectoin|squalane|panthenol|inci/i.test(title)&&/ingredient|serum|essence|cream|mask/i.test(product.slug))n+=2; if(/packag|bottle|jar|pump|tube|label/i.test(title)&&/lotion|cream|serum|shampoo|mask/i.test(product.slug))n+=2; return n; };
let pointer = {SKINCARE:0,HAIRCARE:0,STYLING:0};
const editorialImages = new Map();
const journalMedia = path.join(root,'media','journal');
fs.mkdirSync(journalMedia,{recursive:true});
for (const article of articleMeta) {
  const page = path.join(root,'journal',`${article.slug}.html`);
  if (!fs.existsSync(page)) continue;
  let html = fs.readFileSync(page,'utf8');
  const category = article.category.includes('HAIR') ? 'HAIRCARE' : article.category.includes('STYL') ? 'STYLING' : 'SKINCARE';
  const pool = catalogCards.filter(p=>p.category===category);
  const sorted = [...pool].sort((a,b)=>score(article.title,b)-score(article.title,a));
  const chosen = sorted.length && score(article.title,sorted[0])>0 ? sorted[0] : pool[pointer[category]++ % pool.length];
  const productImage = path.resolve(root,decodeURIComponent(chosen.img));
  const coverFile = `${article.slug}.png`;
  fs.copyFileSync(productImage,path.join(journalMedia,coverFile));
  editorialImages.set(article.slug,coverFile);
  const image = `https://www.aurvonx.com/media/journal/${coverFile}`;
  html = html.replace(/\/media\/journal\/[^" ]+\.(?:svg|png)/g, `/media/journal/${coverFile}`)
    .replace(/https:\/\/www\.aurvonx\.com\/media\/journal\/[^" ]+\.(?:svg|png)/g, image)
    .replace(/(<figure class="page-visual journal-concept-hero"[^>]*>[\s\S]*?<img src=")[^"]+/i, `$1/media/journal/${coverFile}`)
    .replace(/(<figure class="journal-cover"><img src=")[^"]+/i, `$1/media/journal/${coverFile}`)
    .replace(/(<figure class="article-feature-image"><img src=")[^"]+/i, `$1/media/journal/${coverFile}`)
    .replace(/(<meta property="og:image" content=")[^"]+/i, `$1${image}`)
    .replace(/(<meta name="twitter:image" content=")[^"]+/i, `$1${image}`)
    .replace(/("image"\s*:\s*")[^"]+/i, `$1${image}`);
  fs.writeFileSync(page,html);
}

for (const listing of [path.join(root,'journal.html'), ...Array.from({length:8},(_,i)=>path.join(root,'journal',`page-${i+1}.html`))]) {
  if (!fs.existsSync(listing)) continue;
  let html=fs.readFileSync(listing,'utf8');
  html=html.replace(cardPattern,(whole,href,body)=>{
    const slug=path.basename(href,'.html'); const image=editorialImages.get(slug);
    if (!image) return whole;
    return whole.replace(/(<img src=")[^"]+/i,`$1/media/journal/${image}`).replace(/(<img[^>]*alt=")[^"]*/i,`$1${articleMeta.find(a=>a.slug===slug)?.title||slug} editorial product photograph`);
  });
  fs.writeFileSync(listing,html);
}

console.log(JSON.stringify({generatedProductRenders:Object.keys(renders).length,productPagesUpdated:productDetails.length,legacyPagesUpdated:true,editorialCardsUpdated:articleMeta.length,productsInCatalog:catalogCards.length},null,2));
