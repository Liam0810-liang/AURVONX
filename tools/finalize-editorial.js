const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..','docs');
const journal=path.join(root,'journal');
const existing=['brightening','even-tone','fine-lines','blemish-care','barrier-care','hydration','shampoo','hair-mask','conditioner','hair-oil','hair-serum','scalp-serum','breakage-care','hair-growth-projects','clay-paste','wax-pomade','styling-gel','styling-spray','styling-foam','curl-cream','powder-dry-shampoo'];
const colors=[['#dbe7da','#1d493a','#b18a5e'],['#f0e3d7','#6d3f2d','#1d493a'],['#e0e8e4','#294e45','#d4b477'],['#e8e0ed','#59476f','#c49b74'],['#e6e8d9','#4b5d32','#bc805f']];
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function svg(slug,title,category,index){const c=colors[index%colors.length];const motif=/haircare/i.test(category)?'<path d="M742 68 C930 175 760 300 952 438 C1090 536 970 730 735 820" fill="none" stroke="#17291f" stroke-width="38" stroke-linecap="round"/>':/styling/i.test(category)?'<path d="M750 70 Q965 245 772 430 Q660 530 818 695" fill="none" stroke="#274538" stroke-width="30"/>':'<rect x="755" y="220" width="155" height="365" rx="30" fill="#fff" stroke="#829282" stroke-width="5"/><rect x="792" y="163" width="80" height="60" rx="10" fill="#234536"/><path d="M772 382h120" stroke="#c5a671" stroke-width="17"/>';
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" role="img"><title>${esc(title)}</title><desc>Distinct AURVONX ${esc(category)} product-development editorial illustration.</desc><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c[0]}"/><stop offset="1" stop-color="#f8f6ee"/></linearGradient></defs><rect width="1200" height="750" fill="url(#g)"/><circle cx="1030" cy="125" r="210" fill="${c[2]}" opacity=".14"/><path d="M0 620 Q240 525 450 635T850 620 1200 610V750H0Z" fill="#fff" opacity=".55"/><g>${motif}</g><g fill="none" stroke="${c[1]}" opacity=".38" stroke-width="5"><path d="M65 555 C135 400 238 380 310 340 C274 454 201 531 65 555Z"/><path d="M160 526Q184 443 280 365"/><path d="M104 590C170 493 251 477 350 468"/></g><text x="72" y="94" fill="${c[1]}" font-family="Arial,sans-serif" font-size="23" font-weight="700" letter-spacing="5">AURVONX JOURNAL · ${esc(category.toUpperCase())}</text><foreignObject x="72" y="145" width="570" height="430"><div xmlns="http://www.w3.org/1999/xhtml" style="font:700 48px/1.15 Georgia,serif;color:${c[1]};max-height:350px;overflow:hidden">${esc(title)}</div></foreignObject><text x="72" y="690" fill="#627367" font-family="Arial,sans-serif" font-size="17" letter-spacing="2">PRODUCT BRIEF · FORMULA · PACKAGING · MARKET</text></svg>`;}
function takeSection(html,heading){
 const idx=html.indexOf(heading);if(idx<0)return null;
 if(heading==='Plan your private-label range'){const start=html.lastIndexOf('<h2>',idx);const next=html.indexOf('<h2',idx+heading.length);const end=next>0?next:html.indexOf('</main>',idx);return{start,end,html:html.slice(start,end)};}
 const start=html.lastIndexOf('<h2>',idx),open=html.indexOf('<div',idx+heading.length),tagEnd=html.indexOf('>',open)+1;if(open<0||tagEnd<1)return null;
 let depth=1;const re=/<\/?div\b[^>]*>/gi;re.lastIndex=tagEnd;let m;while((m=re.exec(html))){if(/^<div/i.test(m[0]))depth++;else if(--depth===0)return{start,end:re.lastIndex,html:html.slice(start,re.lastIndex)};}return null;
}
let moved=0;
for(let i=0;i<existing.length;i++){
 const slug=existing[i],file=path.join(journal,slug+'.html');let html=fs.readFileSync(file,'utf8');
 const title=(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1].replace(/\s*\|\s*AURVONX.*/i,'');
 const category=/hair-growth|scalp|hair-|shampoo|conditioner|breakage/i.test(slug)?(/curl|clay|wax|foam|spray|pomade|powder/i.test(slug)?'Styling':'Haircare'):'Skincare';
 const svgPath=`../media/journal/${slug}.svg`;
 fs.writeFileSync(path.join(root,'media','journal',`${slug}.svg`),svg(slug,title,category,i));
 const old=takeSection(html,'Plan your private-label range');
 const related=takeSection(html,'Related products');
 const sections=[old,related].filter(Boolean).sort((a,b)=>b.start-a.start);
 for(const section of sections)html=html.slice(0,section.start)+html.slice(section.end);
 const movedBlock=[related?.html,old?.html].filter(Boolean).join('');
 if(movedBlock){html=html.replace('</main>',`${movedBlock}</main>`);moved++;}
 html=html.replace(/(<figure class="page-visual journal-concept-hero">)<picture[\s\S]*?<\/picture>/i,`$1<img src="${svgPath}" alt="${esc(`${title} editorial illustration`)}" width="1200" height="750">`);
 html=html.replace(/(<figure class="journal-cover"><img src=")[^"]+/i,`$1${svgPath}`).replace(/(<figure class="journal-cover"><img[^>]*alt=")[^"]*/i,`$1${esc(`${title} editorial illustration`)}`);
 html=html.replace(/(<meta property="og:image" content=")[^"]+/i,`$1https://www.aurvonx.com/media/journal/${slug}.svg`).replace(/(<meta name="twitter:image" content=")[^"]+/i,`$1https://www.aurvonx.com/media/journal/${slug}.svg`);
 html=html.replace(/("image":\s*")[^"]+/i,`$1https://www.aurvonx.com/media/journal/${slug}.svg`);
 fs.writeFileSync(file,html);
}
for(const name of fs.readdirSync(journal).filter(name=>name.endsWith('.html'))){
 const file=path.join(journal,name);let html=fs.readFileSync(file,'utf8');
 const rootPath=value=>{
  if(value.startsWith('/')||/^(?:https?:|mailto:|tel:|#|data:)/i.test(value))return value;
  const [pathname,...suffix]=value.split(/(?=[?#])/);let clean=pathname.replace(/^(?:\.\.\/|\.\/)+/,'');
  const target=clean==='index.html'||fs.existsSync(path.join(journal,clean))?`/journal/${clean}`:`/${clean}`;
  return target+suffix.join('');
 };
 html=html.replace(/\b(href|src)="(?!\/|https?:|mailto:|tel:|#|data:)([^"]+)"/g,(_,attr,value)=>`${attr}="${rootPath(value)}"`);
 html=html.replace(/(<a\b[^>]*class="brand"[^>]*href=")\/journal\/index\.html("[^>]*>)/i,'$1/index.html$2');
 fs.writeFileSync(file,html);
}
console.log(`Created ${existing.length} distinct legacy article covers and moved end-of-article decision blocks on ${moved} existing articles.`);
