// Rebuild the offline deck after changing the catalog, CSS, renderer or PNG assets.
const fs=require('fs'),assert=require('assert/strict');
let html=fs.readFileSync('index.html','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/api/catalog.json','utf8'));
const images=Object.fromEntries(catalog.map(x=>{const file='assets/api/'+x.slug+'.png';return[file,'data:image/png;base64,'+fs.readFileSync(file).toString('base64')]}));
function replace(re,value){assert(re.test(html),'Missing build marker '+re);html=html.replace(re,()=>value)}
replace(/<style id="api-showcase-style">[^]*?<\/style>/,'<style id="api-showcase-style">\n'+fs.readFileSync('assets/api/showcase.css','utf8')+'</style>');
replace(/<script type="application\/json" id="api-image-source">[^]*?<\/script>/,'<script type="application/json" id="api-image-source">'+JSON.stringify(images)+'</script>');
const code=fs.readFileSync('assets/api/deck-extension.js','utf8').replace('/* API_CATALOG_DATA */[]',()=>JSON.stringify(catalog).replace(/</g,'\\u003c'));
replace(/\/\* API_SHOWCASE_EXTENSION_START \*\/[^]*?\/\* API_SHOWCASE_EXTENSION_END \*\//,'/* API_SHOWCASE_EXTENSION_START */\n'+code+'/* API_SHOWCASE_EXTENSION_END */');
new Function(html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')));
fs.writeFileSync('index.html',html);console.log('Embedded '+catalog.length+' API screens; standalone HTML '+(Buffer.byteLength(html)/1024/1024).toFixed(2)+' MiB.');
