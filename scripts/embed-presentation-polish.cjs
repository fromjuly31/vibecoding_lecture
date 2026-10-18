const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
function embed(start,end,source){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing presentation embedding markers');
 html=html.slice(0,a+start.length)+'\n'+source+'\n'+html.slice(b);
}
embed('/* PRESENTATION_POLISH_START */','/* PRESENTATION_POLISH_END */',fs.readFileSync(path.join(root,'assets/presentation/uiux-polish.js'),'utf8'));
embed('<style id="presentation-polish">','</style>',fs.readFileSync(path.join(root,'assets/presentation/uiux-polish.css'),'utf8'));
new Function(html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')));
fs.writeFileSync(file,html);
console.log('Embedded presentation source in standalone index.html.');
