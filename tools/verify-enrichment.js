const fs=require('fs');
const path=require('path');
const docs=path.resolve(__dirname,'..','docs');
const fail=[];
const list=(dir)=>fs.readdirSync(path.join(docs,dir)).filter((f)=>f.endsWith('.html'));
const groups={skincare:['brightening','even-tone','fine-lines','blemish-care','barrier-care','hydration'],haircare:['shampoo','hair-mask','conditioner','hair-oil','hair-serum','scalp-serum','breakage-care','hair-growth-projects'],styling:['clay-paste','wax-pomade','styling-gel','styling-spray','styling-foam','curl-cream','powder-dry-shampoo']};
const catalog=fs.readFileSync(path.join(docs,'catalog.html'),'utf8');
let catalogTotal=0;
for(const parent of Object.keys(groups)){
  const start=catalog.indexOf(`<section class="catalog-category" id="${parent}">`);
  const next=catalog.indexOf('<section class="catalog-category"',start+10);
  const set=catalog.indexOf('<section class="collection-set-gallery"',start);
  const end=next>=0?next:set;
  const block=catalog.slice(start,end<0?catalog.length:end);
  const count=(block.match(/class="category-product-card"/g)||[]).length;
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
const result={catalogTotal,productPages:list('products').length,brokenProductImgs,missingProductCopy,badSchemas,cjk,blogArticles:list('journal').filter(f=>f!=='index.html').length,brokenBlogImgs,missingBlogContent,setCards:(catalog.match(/class="set-concept-card"/g)||[]).length};
console.log(result);
if(catalogTotal!==75||result.setCards!==23||brokenProductImgs||missingProductCopy||badSchemas||cjk.length||brokenBlogImgs||missingBlogContent){console.error('Enrichment validation failed');process.exit(1)}
