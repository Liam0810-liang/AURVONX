const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..','docs');
const stamp='20260922-3';
let aliases=0,pages=0;
function walk(dir){
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory())walk(file);
  else if(item.isFile()&&item.name.endsWith('.html')){
   let html=fs.readFileSync(file,'utf8').replace(/style\.css\?v=[^"']+/g,`style.css?v=${stamp}`);
   if(item.name!=='index.html'){
    const alias=path.join(dir,item.name.slice(0,-5),'index.html');
    if(fs.existsSync(alias)){
     if(!html.includes('<base href="/">'))html=html.replace('<head>','<head><base href="/">');
     fs.writeFileSync(alias,html);aliases++;
    }
   }
   fs.writeFileSync(file,html);pages++;
  }
 }
}
walk(root);
console.log(`Updated ${pages} canonical HTML pages and ${aliases} directory aliases.`);
