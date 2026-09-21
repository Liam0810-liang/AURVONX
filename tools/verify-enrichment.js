const fs=require('fs');
const path=require('path');
const docs=path.resolve(process.env.SITE_ROOT||path.resolve(__dirname,'..','docs'));
const fail=[];
const list=(dir)=>fs.readdirSync(path.join(docs,dir)).filter((f)=>f.endsWith('.html'));
const groups={skincare:['brightening','even-tone','fine-lines','blemish-care','barrier-care','hydration'],haircare:['shampoo','hair-mask','conditioner','hair-oil','hair-serum','scalp-serum','breakage-care','hair-growth-projects'],styling:['clay-paste','wax-pomade','styling-gel','styling-spray','styling-foam','curl-cream','powder-dry-shampoo']};
const catalog=fs.readFileSync(path.join(docs,'catalog.html'),'utf8');
const productCardSlugs=new Set(),categoryImageErrors=[];
let catalogTotal=0;
for(const parent of Object.keys(groups)){
  const start=catalog.indexOf(`<section class="catalog-category" id="${parent}">`);
  const next=catalog.indexOf('<section class="catalog-category"',start+10);
  const set=catalog.indexOf('<section class="collection-set-gallery"',start);
  const end=next>=0?next:set;
  const block=catalog.slice(start,end<0?catalog.length:end);
  const count=(block.match(/class="category-product-card"/g)||[]).length;
  for(const card of block.matchAll(/<a class="category-product-card" href="products\/([^"#]+)"><span class="category-product-image"><img src="([^\"]+)/g)){
    const [,slug,src]=card;productCardSlugs.add(slug);
    const image=decodeURIComponent(path.basename(src));
    const expected=parent==='skincare'?'护肤':parent==='haircare'?'护发':'造型';
    if(!image.startsWith(expected+'_'))categoryImageErrors.push(`${parent}:${slug}:${image}`);
  }
  console.log(`${parent}: ${count} product cards`);
  catalogTotal+=count;
  if(!count)fail.push(`empty catalog category ${parent}`);
}
let brokenProductImgs=0,missingProductCopy=0,badSchemas=0,cjk=[];
for(const f of list('products')){
  const s=fs.readFileSync(path.join(docs,'products',f),'utf8');
  if(!s.includes('product-discovery-content')||!s.includes('name="keywords"'))missingProductCopy++;
  const src=(s.match(/product-concept-visual"><img src="([^"]+)/)||[])[1];
  if(!src||!fs.existsSync(path.resolve(docs,'products',decodeURIComponent(src))))brokenProductImgs++;
  for(const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1])}catch{badSchemas++}}
  if(/[\u3400-\u9fff]/.test(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ')))cjk.push(f);
}
let brokenBlogImgs=0,missingBlogContent=0;
for(const f of list('journal')){
  if(f==='index.html')continue;
  const s=fs.readFileSync(path.join(docs,'journal',f),'utf8');
  if(!s.includes('editorial-depth-guide'))missingBlogContent++;
  const src=(s.match(/journal-concept-hero"><picture[^>]*><source[^>]*srcset="([^"]+)/)||[])[1];
  if(!src||!fs.existsSync(path.resolve(docs,'journal',decodeURIComponent(src))))brokenBlogImgs++;
}
const result={catalogTotal,uniqueCatalogProducts:productCardSlugs.size,productPages:list('products').length,categoryImageErrors,fullFrameStyles:fs.readFileSync(path.join(docs,'style.css'),'utf8').includes('object-fit:contain!important'),brokenProductImgs,missingProductCopy,badSchemas,cjk,blogArticles:list('journal').filter(f=>f!=='index.html').length,brokenBlogImgs,missingBlogContent,setCards:(catalog.match(/class="set-concept-card"/g)||[]).length};
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
for(const f of list('journal')){
  if(f==='index.html')continue;
  const html=fs.readFileSync(path.join(docs,'journal',f),'utf8');
  const main=(html.match(/<main\b[\s\S]*?<\/main>/)||[])[0]||'';
  const visible=cleanText(main);
  const wordCount=visible.split(/\s+/).filter(Boolean).length;
  if(wordCount<1000)shortBlogArticles.push(`${f}:${wordCount}`);
  if((html.match(/<meta name="author"/gi)||[]).length!==1)duplicateAuthorTags.push(f);
}
function cleanText(s){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
result.categoryPageErrors=categoryPageErrors;
result.secondaryCategoryErrors=secondaryCategoryErrors;
result.shortBlogArticles=shortBlogArticles;
result.duplicateAuthorTags=duplicateAuthorTags;
if(catalogTotal!==75||productCardSlugs.size!==75||categoryImageErrors.length||!result.fullFrameStyles||result.setCards!==23||brokenProductImgs||missingProductCopy||badSchemas||cjk.length||brokenBlogImgs||missingBlogContent||categoryPageErrors.length||secondaryCategoryErrors.length||shortBlogArticles.length||duplicateAuthorTags.length){console.error('Enrichment validation failed');process.exit(1)}
console.log({...result,categoryPageErrors,secondaryCategoryErrors,shortBlogArticles,duplicateAuthorTags});
