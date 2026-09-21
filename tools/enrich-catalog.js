const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'docs');
const files = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.html'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);
const clean = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
const titleOf = (html) => clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [,''])[1]);

const groups = {
  skincare: ['brightening','even-tone','fine-lines','blemish-care','barrier-care','hydration'],
  haircare: ['shampoo','hair-mask','conditioner','hair-oil','hair-serum','scalp-serum','breakage-care','hair-growth-projects'],
  styling: ['clay-paste','wax-pomade','styling-gel','styling-spray','styling-foam','curl-cream','powder-dry-shampoo']
};
const categoryFor = (slug) => Object.entries(groups).find(([, slugs]) => slugs.includes(slug))?.[0] || 'beauty';

const imageFiles = fs.readdirSync(path.join(root, 'media/catalog')).filter((f) => f.endsWith('.png') && !f.startsWith('套装_'));
const imageNames = imageFiles.map((f) => ({ file: f, key: f.replace(/\.png$/,'').replace(/^[^_]+_[^_]+_[^_]+_/,'').toLowerCase().replace(/[_-]+/g,' ') }));
const tokens = (s) => clean(s).toLowerCase().replace(/oem\/odm/g,' ').replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter((w) => w.length > 2 && !['private','label','product','project','care','look','for','with','and','the','from','your','light','strong','gentle','comfort','daily','style','smooth','glow'].includes(w));
const normalizeImageKey = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
function imageFor(title, category) {
  const ts = tokens(title);
  const pool = imageNames.filter((x) => category==='skincare' ? x.file.startsWith('护肤') : category==='haircare' ? x.file.startsWith('护发') : category==='styling' ? x.file.startsWith('造型') : true);
  let best = pool[0], bestScore = -1;
  for (const item of pool) {
    const words = new Set(tokens(item.key));
    let score = ts.reduce((n, t) => n + (words.has(t) ? 4 : 0), 0);
    const pairs = [['serum','essence'],['cream','mask'],['gel','foam'],['wax','pomade'],['spray','mist'],['shampoo','cleanser'],['lotion','toner'],['oil','nourish'],['curl','define'],['clay','paste'],['powder','dry']];
    for(const [a,b] of pairs) if(ts.includes(a)&&words.has(b)||ts.includes(b)&&words.has(a)) score += 1;
    if(score > bestScore){bestScore=score;best=item;}
  }
  const titleNorm=title.toLowerCase();
  const fixed=[
    [/balancing cleansing gel/i,'SK-26036_RESET CLEANSER'],[/blow.dry smoothing milk/i,'ST-26011_TEXTURE CREAM'],[/cica comfort gel cream/i,'SK-26055_CALM SERUM'],[/curl definition gel/i,'ST-26016_LOCK GEL'],[/curl nourish conditioner/i,'HY-26029_SOFT CONDITIONER'],[/curl shaping cream/i,'ST-26015_FINISH GEL'],[/dry shampoo spray/i,'ST-26008_DAY DRY SHAMPOO'],[/ectoin moisture lotion/i,'SK-26002_DAILY LOTION'],[/fibre strength serum/i,'HY-26002_FIBER ESSENCE'],[/flyaway styling stick/i,'ST-26006_BALM'],[/fresh volume shampoo/i,'HY-26009_BALANCE SHAMPOO'],[/frizz smooth serum/i,'HY-26005_SHIELD SERUM'],[/hair growth/i,'HY-26007_ROOT TONIC'],[/hair loss scalp care/i,'HY-26006_RENEW SCALP SERUM'],[/hair loss shampoo/i,'HY-26021_STRENGTH SHAMPOO'],[/heat styling prep serum/i,'HY-26005_SHIELD SERUM'],[/hydrating essence/i,'SK-26004_HYDRA ESSENCE'],[/light balance serum/i,'SK-26014_BALANCE CREAM'],[/matte volume powder/i,'ST-26012_LIFT POWDER'],[/natural shine wax/i,'ST-26005_SHINE POMADE'],[/non.aerosol dry shampoo powder/i,'ST-26008_DAY DRY SHAMPOO'],[/pha refining essence/i,'SK-26008_TONER'],[/protein care hair mask/i,'HY-26028_REPAIR MASK'],[/retinol night serum/i,'SK-26046_RENEW SERUM'],[/root lift foam/i,'ST-26014_CURL MOUSSE'],[/salicylic clarifying serum/i,'SK-26053_SPOT SERUM'],[/scalp fresh shampoo/i,'HY-26021_STRENGTH SHAMPOO'],[/scalp moisture essence/i,'HY-26022_SUPPORT TONIC'],[/scalp refining essence/i,'HY-26022_SUPPORT TONIC'],[/sea salt texture spray/i,'ST-26009_FINISH SPRAY'],[/smooth ends serum/i,'HY-26005_SHIELD SERUM'],[/styling mousse/i,'ST-26014_CURL MOUSSE'],[/strong hold styling gel/i,'ST-26016_LOCK GEL'],[/strong texture clay/i,'ST-26002_MATTE CLAY'],[/curl shaping foam/i,'ST-26014_CURL MOUSSE'],
    [/vitamin.c radiance serum/i,'SK-26047_BRIGHT AMPOULE'],[/niacinamide glow lotion/i,'SK-26002_DAILY LOTION'],[/radiance moisture sheet mask/i,'SK-26048_BRIGHT MASK'],[/even glow body lotion/i,'SK-26002_DAILY LOTION'],
    [/alpha.arbutin tone serum/i,'SK-26012_ARBUTIN ESSENCE'],[/tranexamic tone serum/i,'SK-26041_TONE SERUM'],[/even tone cream/i,'SK-26029_FADE CREAM'],[/post.blemish tone serum/i,'SK-26053_SPOT SERUM'],
    [/multi.ha hydration serum/i,'SK-26004_HYDRA ESSENCE'],[/weightless water gel/i,'SK-26010_WATER GEL'],[/overnight moisture mask/i,'SK-26039_SLEEP MASK'],[/hydration sheet mask/i,'SK-26033_RADIANCE MASK'],
    [/ceramide barrier cream/i,'SK-26057_REPAIR CREAM'],[/b5 comfort serum/i,'SK-26055_CALM SERUM'],[/cica comfort gel cream/i,'SK-26054_CALM DROPS'],[/gentle milk cleanser/i,'SK-26036_RESET CLEANSER'],
    [/argan shine oil/i,'HY-26004_NOURISH OIL'],[/camellia nourishing hair oil/i,'HY-26004_NOURISH OIL'],[/squalane light hair oil/i,'HY-26003_GLOSS HAIR OIL'],[/argan smooth hair mask/i,'HY-26026_MINUTE RESCUE MASK'],[/colour care hair mask/i,'HY-26028_REPAIR MASK'],
    [/water.based shine wax/i,'ST-26001_FIRM WAX'],[/matte texture clay/i,'ST-26002_MATTE CLAY'],[/flexible styling paste/i,'ST-26003_PASTE'],[/strong hold pomade/i,'ST-26004_POMADE'],[/sea salt texture spray/i,'ST-26011_TEXTURE CREAM'],
    [/root lift foam/i,'HY-26024_VOLUME MOUSSE'],[/curl shaping foam/i,'ST-26014_CURL MOUSSE'],[/wet look styling gel/i,'ST-26015_FINISH GEL']
  ];
  const preferred=fixed.find(([re])=>re.test(titleNorm));
  if(preferred){const needle=normalizeImageKey(preferred[1]);const found=imageNames.find(x=>normalizeImageKey(x.key).includes(needle));if(found)best=found;}
  return best ? `../media/catalog/${encodeURIComponent(best.file)}` : '../media/editorial-0.png';
}

// Turn each top-level category into a complete, browsable range grouped by its actual child categories.
const categoryLabels = {skincare:'Skincare',haircare:'Haircare',styling:'Styling'};
const articleFocus={brightening:['Radiance positioning','Distinguish a radiant-looking finish from promises to alter natural skin colour.'], 'even-tone':['Tone-care scope','Describe cosmetic appearance and verify the exact ingredient form; avoid implying treatment of melasma or other medical conditions.'], 'fine-lines':['Night-care format and tolerance','Compare retinoid derivatives and peptide directions only after market rules, formula stability and use guidance are clear.'], 'blemish-care':['Oil balance and claim boundaries','Separate cleansing and oil appearance from acne treatment claims, which may trigger drug rules in some markets.'], 'barrier-care':['Comfort and the complete system','Assess cleanser mildness, emollient feel and moisturizer spread together; an ingredient name alone does not prove a clinical barrier result.'], hydration:['Serum versus moisturizer','Test layering, tack and climate performance; a water-binding serum and a cream or gel can have different roles.'], shampoo:['Cleansing profile','Define cleansing strength, foam, rinse feel and wash frequency; evaluate residue for the target user.'], 'hair-mask':['Mask versus conditioner','Test combability and rinse feel; distinguish a periodic treatment step from routine detangling.'], conditioner:['Rinse-out versus leave-in','Differentiate use method, dosage, residue and packaging before formula and label decisions.'], 'hair-oil':['Oil versus leave-in milk','Compare spread, finish, weight and dispensing; confirm the actual emollients in the final INCI.'], 'hair-serum':['Smoothing versus heat preparation','Any heat-protection claim needs support for the finished formula and stated test conditions.'], 'scalp-serum':['Scalp cosmetic scope','Clarify the cosmetic role, leave-on exposure, fragrance, directions and local ingredient limits.'], 'breakage-care':['Breakage versus shedding','These are different concerns; keep cosmetic copy focused on hair appearance and manageability unless another product pathway is confirmed.'], 'hair-growth-projects':['Regulatory route first','Hair-growth or hair-loss wording can cross cosmetic boundaries; obtain a market classification review before label or ad decisions.'], 'clay-paste':['Finish and reworkability','Describe matte level, hold, pliability and washout separately, then bench-test application amounts.'], 'wax-pomade':['Shine, hold and washout','Water-based and oil-rich systems differ in washout and feel; confirm the base before final copy.'], 'styling-gel':['Hold and visible finish','Define curl definition, strong hold or wet look separately; test flaking, tack and drying time.'], 'styling-spray':['Texture versus finishing hold','Separate texturizing and hold claims; pack, spray pattern and shipping review affect format feasibility.'], 'styling-foam':['Pump versus aerosol','Dispensing changes foam, instructions and shipping; confirm the format and market review needs.'], 'curl-cream':['Assign each format a role','Cream, blow-dry milk and styling stick serve different moments; test weight, tack and layering.'], 'powder-dry-shampoo':['Volume grip versus refresh','Clarify application area and residue expectations; review aerosol requirements for spray formats.']};
for (const [parent, slugs] of Object.entries(groups)) {
  const blocks = slugs.map((slug) => {
    const series = read(`series/${slug}.html`);
    const categoryTitle = titleOf(series).replace(/\s*[·|].*$/,'').trim();
    const productSlugs = [...series.matchAll(/href="\.\.\/products\/([^"#]+)\.html"/g)].map((m) => m[1]);
    const cards = productSlugs.map((productSlug) => {
      const product = read(`products/${productSlug}.html`);
      const title = titleOf(product).replace(/\s+OEM\/ODM.*$/,'');
      const img = imageFor(title, parent);
      return `<a class="category-product-card" href="products/${productSlug}.html"><span class="category-product-image"><img src="${img}" alt="${title} private-label product concept" loading="lazy"><span class="image-zoom-hint">View image</span></span><span class="category-product-title">${title}</span><span class="category-product-cta">Product details →</span></a>`;
    }).join('');
    return `<section class="catalog-subcategory" aria-labelledby="${slug}-heading"><div class="catalog-subcategory-head"><div><p class="eyebrow">${categoryLabels[parent]} COLLECTION</p><h3 id="${slug}-heading">${categoryTitle}</h3></div><a class="text-link" href="series/${slug}.html">Explore ${categoryTitle} →</a></div><div class="category-product-grid">${cards}</div></section>`;
  }).join('');
  const target = new RegExp(`(<section class="catalog-category" id="${parent}">)[\\s\\S]*?(?=<section class="catalog-category"|<section class="catalog-gallery|<section class="collection-set-gallery|<\\/main>)`);
  const html = read('catalog.html').replace(target, (_all, start) => `${start}<div class="catalog-category-intro"><h2>${categoryLabels[parent]}</h2><p>Browse all ${categoryLabels[parent].toLowerCase()} product types, organized by focused subcategory. Each card opens an individual product brief.</p></div>${blocks}</section>`);
  write('catalog.html', html);
}

// Keep collection photography separate from the 75 individual product pages.
const setFiles = fs.readdirSync(path.join(root, 'media/catalog')).filter((f) => f.endsWith('.png') && f.startsWith('套装_'));
const setsMarkup = setFiles.map((file) => {
  const match = file.match(/(SET-\d+)_([^_]+)_AURVONX/i);
  const code = match?.[1] || 'Collection';
  const title = (match?.[2] || 'Private Label Set').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return `<article class="set-concept-card"><div class="category-product-image"><img src="media/catalog/${encodeURIComponent(file)}" alt="${title} coordinated private-label beauty collection concept" loading="lazy"><span class="image-zoom-hint">View image</span></div><h3>${title} Set</h3><p>${code} · Coordinated collection concept</p><a href="contact.html">Discuss a custom set →</a></article>`;
}).join('');
const catalogWithSets = read('catalog.html').replace(/<section class="[^"]*(?:catalog-gallery|collection-set-gallery)[^"]*"[^>]*>[\s\S]*?<\/section>/, `<section class="collection-set-gallery"><p class="eyebrow">COORDINATED COLLECTIONS</p><h2>Private-Label Set Concepts</h2><p>Explore coordinated range directions. Set contents, formula and packaging are defined for each brand brief.</p><div class="set-concept-grid">${setsMarkup}</div></section>`);
write('catalog.html', catalogWithSets);

// Every individual product detail page gets a relevant concept image, discovery copy, FAQ and explicit category trail.
for (const file of files('products')) {
  const slug = file.replace('.html','');
  let html = read(`products/${file}`);
  const title = titleOf(html).replace(/\s+OEM\/ODM.*$/,'');
  const category = categoryFor((html.match(/class="crumb"[\s\S]*?href="\.\.\/series\/([^"/]+)\.html"/)||[])[1]);
  const image = imageFor(title, category);
  const label = categoryLabels[category] || 'Beauty';
  const words = tokens(title);
  const format = /shampoo|cleanser|wash/i.test(title) ? 'rinse-off wash' : /mask/i.test(title) ? 'mask' : /spray|mist/i.test(title) ? 'spray' : /oil/i.test(title) ? 'oil' : /gel/i.test(title) ? 'gel' : /foam|mousse/i.test(title) ? 'foam' : /cream|lotion|milk|balm/i.test(title) ? 'cream or emulsion' : 'serum or essence';
  const focus = words.slice(0,3).join(' ') || title.toLowerCase();
  if (html.includes('product-discovery-content')) {
    const image=imageFor(title,category);
    const webp=image.replace(/\.png$/i,'.webp');
    html=html.replace(/srcset="\.\.\/media\/(?:catalog|editorial)[^"]*"/g,`srcset="${webp}"`)
      .replace(/src="\.\.\/media\/(?:catalog|editorial)[^"]*"/g,`src="${image}"`);
    write(`products/${file}`,html);
    continue;
  }
  const insert = `<section class="product-discovery-content" aria-labelledby="discovery-heading"><div class="product-concept-visual"><img src="${image}" alt="${title} product concept visual for a private-label ${label.toLowerCase()} range" loading="lazy"><p>Product concept visual. Formula, pack and artwork are confirmed for each project.</p></div><div class="product-discovery-copy"><p class="eyebrow">FORMULATION &amp; SEARCH GUIDE</p><h2 id="discovery-heading">${title}: product direction and buyer guide</h2><p>${title} is a product format direction for brands planning a ${label.toLowerCase()} range. Start with the intended routine step, target customer, sales channel and destination market; then align the texture and pack with the product's role. This page describes a development brief, not a finished formula or a guaranteed performance claim.</p><h3>What to define in the product brief</h3><p>For a ${format}, agree on application feel, rinse-off or leave-on use, fragrance preference, pack compatibility and target price before sampling. The ingredient list and permitted claims must be checked against the final formula and the regulations in every sales market.</p><ul><li><strong>Customer and use:</strong> describe who the product is for and where it fits in the routine.</li><li><strong>Formula direction:</strong> discuss ingredient options and sensory targets; verify compatibility, stability and substantiation with the manufacturing partner.</li><li><strong>Packaging:</strong> confirm material, dispensing format, label space and market-specific language.</li><li><strong>Search intent:</strong> buyers often compare ${focus}, format, routine order and private-label manufacturing options. Use accurate INCI and product information once the project specification is approved.</li></ul><h3>Ingredient and claim considerations</h3><p>Ingredient popularity is a discovery signal, not proof that a finished product delivers a particular result. Review the exact ingredient identity, concentration, stability and evidence in the finished formula. Keep cosmetic language truthful, specific and appropriate to the destination market; avoid disease-treatment or unsubstantiated before-and-after promises.</p><h3>Frequently asked questions</h3><details><summary>Can this product be customized for my brand?</summary><p>Yes. The project brief can cover formula direction, texture, fragrance, pack and artwork. The feasible options and order requirements are confirmed after technical review.</p></details><details><summary>Are the pictured formula and package final?</summary><p>No. The image is an illustrative product concept. Final formula, claims, packaging and artwork are confirmed for each project.</p></details><details><summary>What information helps prepare a quotation?</summary><p>Share your destination market, target customer, sales channel, requested format, packaging preference and estimated order quantity.</p></details><p class="product-source-note">Claims and market requirements are reviewed against the approved formula and destination-market rules. See <a href="../journal/${(html.match(/journal\/([^"/]+)\.html/)||[])[1]||'index'}.html">related product guidance</a> and <a href="../contact.html">request a project review</a>.</p></div></section>`;
  const displayImage=image;
  const displayWebp=displayImage.replace(/\.png$/i,'.webp');
  html=html.replace(/<figure class="page-visual">[\s\S]*?<\/figure>/,`<figure class="page-visual product-concept-hero"><picture class="optimized-image"><source type="image/webp" srcset="${displayWebp}"><img src="${displayImage}" alt="${title} private-label product concept" width="800" height="800"></picture><figcaption>Illustrative product concept; final formula, packaging and artwork are confirmed for each project.</figcaption></figure>`);
  html=html.replace(/<picture class="optimized-image"><source type="image\/webp" srcset="\.\.\/media\/editorial-[^\"]+"><img class="wide" src="\.\.\/media\/editorial-[^\"]+"[^>]*><\/picture>/,`<picture class="optimized-image"><source type="image/webp" srcset="${displayWebp}"><img class="wide product-concept-image" src="${displayImage}" alt="${title} product concept visual" width="800" height="800"></picture>`);
  const mainEnd = html.lastIndexOf('</main>');
  if (mainEnd < 0) continue;
  write(`products/${file}`, html.slice(0,mainEnd) + insert + html.slice(mainEnd));
}

// Add useful, search-focused editorial depth and a matching concept image to each existing guide.
for (const file of files('journal')) {
  if (file==='index.html') continue;
  const slug=file.replace('.html','');
  let html=read(`journal/${file}`);
  if(html.includes('editorial-depth-guide')) continue;
  const title=titleOf(html);
  const category=categoryFor(slug);
  const image=imageFor(title,category);
  const articleImage=image;
  html=html.replace(/<figure class="page-visual">[\s\S]*?<\/figure>/,`<figure class="page-visual journal-concept-hero"><picture class="optimized-image"><source type="image/webp" srcset="${articleImage.replace(/\.png$/i,'.webp')}"><img src="${articleImage}" alt="Illustrative ${categoryLabels[category]||'beauty'} product concept for ${title}" width="800" height="800"></picture><figcaption>Illustrative product concept; final formula and packaging are project-specific.</figcaption></figure>`);
  const subject=title.replace(/\s*\|.*$/,'');
  const body=`<section class="editorial-depth-guide" aria-labelledby="editorial-depth-heading"><figure class="journal-cover"><img src="${image}" alt="Illustrative ${categoryLabels[category]||'beauty'} product concept for ${subject}" loading="lazy"><figcaption>Illustrative product concept; finished formula and packaging are project-specific.</figcaption></figure><p class="eyebrow">PRACTICAL FORMULATION &amp; SOURCING GUIDE</p><h2 id="editorial-depth-heading">A practical framework for ${subject.toLowerCase()}</h2><p>Product planning begins with a clearly defined customer need, not a trending ingredient alone. Decide which routine step the product serves, what sensory experience is expected and how a customer will use it alongside the rest of the range. This helps a brand create a coherent assortment instead of several products competing for the same role.</p><h3>1. Translate the search into a product brief</h3><p>Search phrases can reveal questions buyers are trying to answer: which format suits their routine, what ingredients are commonly discussed, how products differ and what private-label development involves. Treat those phrases as research prompts. Validate demand in the target country and channel, then write product information that answers the question precisely without promising an unverified result.</p><p>A useful brief records the target customer, market, channel, preferred texture, fragrance direction, pack format, target price and likely launch quantity. It also separates established requirements from open questions. For example, an ingredient name alone does not specify its form, concentration, stability needs or compatibility with the final base.</p><h3>2. Evaluate formula, evidence and claims together</h3><p>Ingredient selection should be followed by technical review of identity, formula compatibility, stability, safety and substantiation. A supplier's ingredient-level evidence does not automatically prove the same effect for a finished cosmetic. Keep claims proportionate to the available product evidence and permitted cosmetic scope in each destination market. Avoid disease-treatment wording, guaranteed outcomes and unsupported numerical claims.</p><p>For a science-led positioning, explain the product's intended cosmetic role, how it fits into a routine and what information is still under evaluation. Clear limitations build more trust than vague superlatives. Ask the manufacturing partner which tests, documents and claim reviews can be provided for the exact project.</p><h3>3. Make packaging and the routine work together</h3><p>Packaging affects dispensing, portability, product protection, label capacity and the customer's experience. Confirm compatibility with the formula and shipping conditions, then review artwork and required local-language information before production. A launch range can use one hero format with carefully chosen complementary steps; sets work best when every item has a distinct role.</p><h3>Questions to ask before sampling</h3><ul><li>Which customer, market and routine step is this product designed for?</li><li>What is the evidence and regulatory basis for each proposed claim?</li><li>How will formula direction, pack compatibility and quality checks be evaluated?</li><li>Which sample criteria determine approval, and who signs off the final specification?</li></ul><h3>Frequently asked questions</h3><details><summary>Does a popular ingredient guarantee product demand?</summary><p>No. Interest varies by market and channel, and an ingredient trend alone does not validate a product opportunity. Check current local search, retailer and customer data before committing to an assortment.</p></details><details><summary>Can an OEM/ODM partner confirm every claim in advance?</summary><p>Claims depend on the final formula, supporting evidence and destination-market requirements. Review them after the formula direction and testing plan are defined.</p></details><p>For a focused product shortlist, share the destination market, customer, channel, preferred format and estimated quantity with the <a href="../contact.html">AURVONX project team</a>. Explore the related <a href="../catalog.html#${category}">${(categoryLabels[category]||'beauty').toLowerCase()} product range</a> and its individual product briefs.</p></section>`;
  const focus=articleFocus[slug]||['Product role and brief','Define the customer, use method and performance expectations before choosing the formula direction.'];
  const customInsight=`<h3>${focus[0]}</h3><p>${focus[1]}</p>`;
  const closing=html.lastIndexOf('</main>');
  if(closing<0) continue;
  const enrichedBody=body.replace(/<figure class="journal-cover">[\s\S]*?<\/figure>/,'').replace('<h3>1. Translate the search into a product brief</h3>',`${customInsight}<h3>1. Translate the search into a product brief</h3>`).replace('</section>','<p class="editorial-references">Claim review references: <a href="https://www.fda.gov/cosmetics/cosmetics-labeling/cosmetics-labeling-claims" rel="external">FDA guidance on cosmetic claims</a> · <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32013R0655" rel="external">EU common criteria for cosmetic claims</a>. Review current rules for the destination market.</p></section>');
  html=html.slice(0,closing)+enrichedBody+html.slice(closing);
  html=html.replace(/<meta (?:name="dateModified"|property="article:modified_time")[^>]*>/gi,'');
  html=html.replace('</head>',`<meta property="article:modified_time" content="2026-09-22"><meta name="author" content="AURVONX Editorial Team"></head>`);
  const articleImageUrl=`https://www.aurvonx.com${image.replace(/^\.\./,'')}`;
  html=html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g,(all,open,json,close)=>{try{const data=JSON.parse(json);if(data['@type']==='Article'){data.image=articleImageUrl;data.dateModified='2026-09-22';data.author={'@type':'Organization',name:'AURVONX Editorial Team'};return open+JSON.stringify(data)+close;}}catch{}return all;});
  html=html.replace(/(<meta property="og:image" content=")[^"]+/i,`$1${articleImageUrl}`).replace(/(<meta name="twitter:image" content=")[^"]+/i,`$1${articleImageUrl}`);
  write(`journal/${file}`,html);
}

// Keep the menu aligned with the full taxonomy on every page.
for (const dir of ['.','products','series','journal']) {
  const base=path.join(root,dir);
  for(const name of fs.readdirSync(base).filter((f)=>f.endsWith('.html'))){
    const file=dir==='.'?name:`${dir}/${name}`;
    let html=read(file);
    if(!html.includes('series/hair-growth-projects.html')){
      html=html.replace(/(<a href="series\/breakage-care\.html">Growth &amp; Breakage Care<\/a>)/, '$1<a href="series/hair-growth-projects.html">Hair Growth Projects</a>');
      write(file,html);
    }
  }
}

// Product-specific metadata: explain the product direction and expose its concept visual to crawlers.
for(const file of files('products')){
  const slug=file.replace('.html','');
  let html=read(`products/${file}`);
  const title=titleOf(html).replace(/\s+OEM\/ODM.*$/,'');
  const category=categoryFor((html.match(/class="crumb"[\s\S]*?href="\.\.\/series\/([^"/]+)\.html"/)||[])[1]);
  const image=`https://www.aurvonx.com${imageFor(title,category).replace(/^\.\./,'')}`;
  html=html.replace(/(<meta property="og:image" content=")[^"]+/i,`$1${image}`).replace(/(<meta name="twitter:image" content=")[^"]+/i,`$1${image}`);
  if(!html.includes('name="keywords"')){
    const keywords=[title,`${title} private label`,`private label ${category}`,`${category} OEM ODM`,`${title} product development`].join(', ');
    html=html.replace('</head>',`<meta name="keywords" content="${keywords}"></head>`);
  }
  html=html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g,(all,open,json,close)=>{
    try{const data=JSON.parse(json);if(data['@type']==='Product'){data.image=image;data.category=category;data.description=`${title} private-label ${category} product concept for OEM/ODM development with AURVONX in Guangzhou, China. Formula, claims and packaging are confirmed per project.`;return open+JSON.stringify(data)+close;}}catch{}
    return all;
  });
  write(`products/${file}`,html);
}

// Give every blog index link a visual preview from its article-specific concept image.
let journalIndex=read('journal.html');
journalIndex=journalIndex.replace(/<a class="card" href="journal\/([^"/]+)\.html"><span class="code">([^<]+)<\/span><h3>([\s\S]*?)<\/h3>/g,(all,slug,code,heading)=>{
  const article=read(`journal/${slug}.html`);
  const src=(article.match(/<figure class="journal-cover"><img src="([^"]+)"/)||[])[1];
  return `<a class="card journal-index-card" href="journal/${slug}.html">${src?`<span class="journal-index-image"><img src="${src.replace(/^\.\.\//,'')}" alt="${clean(heading)} article illustration" loading="lazy"></span>`:''}<span class="code">${code}</span><h3>${heading}</h3>`;
});
write('journal.html',journalIndex);

function bumpStyles(dir=root){for(const name of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,name.name);if(name.isDirectory())bumpStyles(full);else if(name.isFile()&&name.name.endsWith('.html')){const current=fs.readFileSync(full,'utf8');const updated=current.replace(/style\.css\?v=[^"']+/g,'style.css?v=20260922-1');if(updated!==current)fs.writeFileSync(full,updated);}}}
bumpStyles();
console.log(`Enhanced ${Object.values(groups).flat().length} child categories, ${files('products').length} product pages, and ${files('journal').filter(f=>f!=='index.html').length} editorial guides.`);
