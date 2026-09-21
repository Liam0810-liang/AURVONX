const fs=require('fs');
const path=require('path');
const docs=path.resolve(process.env.SITE_ROOT||path.resolve(__dirname,'..','docs'));
const fail=[];
const list=(dir)=>fs.readdirSync(path.join(docs,dir)).filter((f)=>f.endsWith('.html'));
const groups={skincare:['brightening','even-tone','fine-lines','blemish-care','barrier-care','hydration'],haircare:['shampoo','hair-mask','conditioner','hair-oil','hair-serum','scalp-serum','breakage-care','hair-growth-projects'],styling:['clay-paste','wax-pomade','styling-gel','styling-spray','styling-foam','curl-cream','powder-dry-shampoo']};
const catalog=fs.readFileSync(path.join(docs,'catalog.html'),'utf8');
const productCardSlugs=new Set(),categoryImageErrors=[],categoryImageDuplicates=[];
let catalogTotal=0;
for(const parent of Object.keys(groups)){
  const start=catalog.indexOf(`<section class="catalog-category" id="${parent}">`);
  const next=catalog.indexOf('<section class="catalog-category"',start+10);
  const set=catalog.indexOf('<section class="collection-set-gallery"',start);
  const end=next>=0?next:set;
  const block=catalog.slice(start,end<0?catalog.length:end);
  const count=(block.match(/class="category-product-card"/g)||[]).length;
  const categoryImages=new Map();
  for(const card of block.matchAll(/<a class="category-product-card" href="products\/([^"#]+)">[\s\S]*?<img src="([^\"]+)/g)){
    const [,slug,src]=card;productCardSlugs.add(slug);
    const image=decodeURIComponent(path.basename(src));
    if(categoryImages.has(image))categoryImageDuplicates.push(`${parent}:${slug} repeats ${categoryImages.get(image)} image ${image}`);else categoryImages.set(image,slug);
    const expected=parent==='skincare'?'护肤':parent==='haircare'?'护发':'造型';
    if(image.endsWith('.svg')){if(image!==`${slug.replace(/\.html$/,'')}.svg`||!fs.existsSync(path.join(docs,'media','product-concepts',image)))categoryImageErrors.push(`${parent}:${slug}:${image}`);}
    else if(fs.existsSync(path.join(docs,'media','catalog','product-renders',image))){}
    else if(!image.startsWith(expected+'_'))categoryImageErrors.push(`${parent}:${slug}:${image}`);
  }
  console.log(`${parent}: ${count} product cards`);
  catalogTotal+=count;
  if(!count)fail.push(`empty catalog category ${parent}`);
}
let brokenProductImgs=0,missingProductCopy=0,badSchemas=0,cjk=[],productImages=new Set();
for(const f of list('products')){
  const s=fs.readFileSync(path.join(docs,'products',f),'utf8');
  if(!s.includes('product-discovery-content')||!s.includes('name="keywords"'))missingProductCopy++;
  const src=(s.match(/product-concept-visual"><img src="([^"]+)/)||[])[1];
  if(!src||!fs.existsSync(path.resolve(docs,'products',decodeURIComponent(src))))brokenProductImgs++;else productImages.add(decodeURIComponent(src));
  if(!s.includes('product-search-guide'))missingProductCopy++;
  for(const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1])}catch{badSchemas++}}
  if(/[\u3400-\u9fff]/.test(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ')))cjk.push(f);
}
let brokenBlogImgs=0,missingBlogContent=0;
const articleFiles=list('journal').filter(f=>f!=='index.html'&&!/^page-\d+\.html$/.test(f));
for(const f of articleFiles){
  const s=fs.readFileSync(path.join(docs,'journal',f),'utf8');
  if(!s.includes('editorial-depth-guide')&&!s.includes('class="editorial-article"'))missingBlogContent++;
  const src=(s.match(/<figure class="(?:journal-cover|article-feature-image|page-visual journal-concept-hero)"[^>]*>[\s\S]*?<img src="([^"]+)/)||[])[1];
  const imagePath=src?(src.startsWith('/')?path.join(docs,src.slice(1)):src.startsWith('media/')?path.join(docs,decodeURIComponent(src)):path.resolve(docs,'journal',decodeURIComponent(src))):'';
  if(!src||!fs.existsSync(imagePath))brokenBlogImgs++;
}
const result={catalogTotal,uniqueCatalogProducts:productCardSlugs.size,productPages:list('products').length,categoryImageErrors,fullFrameStyles:fs.readFileSync(path.join(docs,'style.css'),'utf8').includes('object-fit:contain!important'),brokenProductImgs,missingProductCopy,badSchemas,cjk,blogArticles:articleFiles.length,brokenBlogImgs,missingBlogContent,setCards:(catalog.match(/class="set-concept-card"/g)||[]).length};
const categoryPageErrors=[];
for(const parent of Object.keys(groups)){
  const file=path.join(docs,`${parent}.html`);
  if(!fs.existsSync(file)){categoryPageErrors.push(`missing category page ${parent}`);continue;}
  const html=fs.readFileSync(file,'utf8');
  const slugs=[...html.matchAll(/href="products\/([^"#]+)\.html"/g)].map(m=>m[1]);
  const catalogStart=catalog.indexOf(`<section class="catalog-category" id="${parent}">`);
  const catalogNext=catalog.indexOf('<section class="catalog-category"',catalogStart+10);
  const catalogSets=catalog.indexOf('<section class="collection-set-gallery"',catalogStart);
  const stop=[catalogNext,catalogSets].filter(n=>n>catalogStart).sort((a,b)=>a-b)[0]??catalog.length;
  const expected=[...catalog.slice(catalogStart,stop).matchAll(/href="products\/([^"#]+)\.html"/g)].map(m=>m[1]);
  if(slugs.length!==expected.length||new Set(slugs).size!==expected.length||slugs.some(x=>!expected.includes(x)))categoryPageErrors.push(`${parent} page has ${slugs.length} products; expected exactly ${expected.length}`);
  const canonical=`https://www.aurvonx.com/${parent}.html`;
  if(!html.includes(`rel="canonical" href="${canonical}"`)||!html.includes(canonical)||!fs.readFileSync(path.join(docs,'sitemap.xml'),'utf8').includes(canonical))categoryPageErrors.push(`${parent} page metadata or sitemap missing`);
  if((html.match(/<h1\b/gi)||[]).length!==1)categoryPageErrors.push(`${parent} page must have exactly one H1`);
  if(/[\u3400-\u9fff]/.test(html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ')))categoryPageErrors.push(`${parent} page has visible CJK text`);
}
const secondaryCategoryErrors=[];
for(const parent of Object.keys(groups))for(const slug of groups[parent]){
  const html=fs.readFileSync(path.join(docs,'series',`${slug}.html`),'utf8');
  const links=[...html.matchAll(/href="\.\.\/products\/([^"#]+)\.html"/g)].map(m=>m[1]);
  if(!links.length||new Set(links).size!==links.length)secondaryCategoryErrors.push(`${slug} is empty or repeats products`);
  const subsectionStart=catalog.indexOf(`<section class="catalog-subcategory" aria-labelledby="${slug}-heading">`);
  const subsectionNext=catalog.indexOf('<section class="catalog-subcategory"',subsectionStart+10);
  const subsectionEnd=subsectionNext>subsectionStart?subsectionNext:catalog.indexOf('</section>',subsectionStart);
  const expected=new Set([...catalog.slice(subsectionStart,subsectionEnd).matchAll(/href="products\/([^"#]+)\.html"/g)].map(m=>m[1]));
  if(links.length!==expected.size||links.some(product=>!expected.has(product)))secondaryCategoryErrors.push(`${slug} product set differs from its catalog subcategory`);
}
const shortBlogArticles=[],duplicateAuthorTags=[];
for(const f of articleFiles){
  const html=fs.readFileSync(path.join(docs,'journal',f),'utf8');
  const main=(html.match(/<main\b[\s\S]*?<\/main>/)||[])[0]||'';
  const visible=cleanText(main);
  const wordCount=visible.split(/\s+/).filter(Boolean).length;
  if(wordCount<1000)shortBlogArticles.push(`${f}:${wordCount}`);
  if((html.match(/<meta name="author"/gi)||[]).length!==1)duplicateAuthorTags.push(f);
}
function cleanText(s){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
const listingFiles=['journal.html',...list('journal').filter(f=>/^page-\d+\.html$/.test(f)).map(f=>`journal/${f}`)];
const listingSlugs=[],listingImages=[],listingErrors=[];
for(const rel of listingFiles){const html=fs.readFileSync(path.join(docs,rel),'utf8');const main=(html.match(/<main\b[\s\S]*?<\/main>/)||[])[0]||'';const canonical=(html.match(/<link rel="canonical" href="([^"]+)"/)||[])[1];if(!canonical)listingErrors.push(`${rel} missing canonical`);for(const card of main.matchAll(/<a class="card journal-index-card" href="\/journal\/([^"#]+)\.html"><span class="journal-index-image"><img src="\/media\/journal\/([^"#]+)"/g)){listingSlugs.push(card[1]);listingImages.push(card[2]);if(!fs.existsSync(path.join(docs,'media','journal',card[2])))listingErrors.push(`${rel} broken cover ${card[2]}`);}}
if(listingSlugs.length!==new Set(listingSlugs).size)listingErrors.push('journal listings repeat article cards');
if(listingImages.length!==new Set(listingImages).size)listingErrors.push('journal listing repeats cover images');
if(listingSlugs.length!==113||articleFiles.length!==113)listingErrors.push(`expected 113 indexed articles across pages; got ${listingSlugs.length} listings and ${articleFiles.length} article files`);
const productImageDuplicates=productImages.size;
const siteCjk=[];
function scanPages(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())scanPages(file);else if(entry.name.endsWith('.html')){const html=fs.readFileSync(file,'utf8');const visible=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ');if(/[\u3400-\u9fff]/.test(visible))siteCjk.push(path.relative(docs,file));}}}
scanPages(docs);
let badArticleSchemas=0;for(const f of articleFiles){const html=fs.readFileSync(path.join(docs,'journal',f),'utf8');for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1])}catch{badArticleSchemas++}}}
result.categoryPageErrors=categoryPageErrors;
result.secondaryCategoryErrors=secondaryCategoryErrors;
result.shortBlogArticles=shortBlogArticles;
result.duplicateAuthorTags=duplicateAuthorTags;
result.categoryImageDuplicates=categoryImageDuplicates;
result.uniqueProductDetailImages=productImageDuplicates;
result.listingErrors=listingErrors;
result.visibleCjkPages=siteCjk;
result.badArticleSchemas=badArticleSchemas;
if(catalogTotal!==75||productCardSlugs.size!==75||categoryImageErrors.length||categoryImageDuplicates.length||productImages.size!==75||!result.fullFrameStyles||result.setCards!==23||brokenProductImgs||missingProductCopy||badSchemas||cjk.length||siteCjk.length||brokenBlogImgs||missingBlogContent||badArticleSchemas||categoryPageErrors.length||secondaryCategoryErrors.length||shortBlogArticles.length||duplicateAuthorTags.length||listingErrors.length){console.error('Enrichment validation failed');console.error(JSON.stringify({...result,categoryPageErrors,secondaryCategoryErrors,shortBlogArticles,duplicateAuthorTags,listingErrors},null,2));process.exit(1)}
console.log({...result,categoryPageErrors,secondaryCategoryErrors,shortBlogArticles,duplicateAuthorTags,listingErrors});
