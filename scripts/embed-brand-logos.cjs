// Preserve the existing brand artwork in standalone HTML exports.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
const logos=Object.fromEntries([['openai','svg','image/svg+xml'],['gemini','png','image/png'],['claude','svg','image/svg+xml']].map(([name,ext,type])=>[name,'data:'+type+';base64,'+fs.readFileSync(path.join(root,'assets/brands',name+'.'+ext)).toString('base64')]));
const block='<script type="application/json" id="ai-brand-source">'+JSON.stringify(logos)+'</script>';
if(html.includes('id="ai-brand-source"'))html=html.replace(/<script type="application\/json" id="ai-brand-source">[^]*?<\/script>/,()=>block);
else{assert(html.includes('<script id="practice-focus-script">'));html=html.replace('<script id="practice-focus-script">',()=>block+'\n<script id="practice-focus-script">');}
fs.writeFileSync(file,html);
console.log('Embedded the three existing AI brand logos.');
