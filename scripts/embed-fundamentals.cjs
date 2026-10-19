const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
for(const [name,start,end] of [
 ['css','<style id="fundamentals-style">','</style>'],
 ['js','/* FUNDAMENTALS_JS_START */','/* FUNDAMENTALS_JS_END */']
]){
 const from=html.indexOf(start),to=html.indexOf(end,from+start.length);
 if(from<0||to<0)throw Error('Missing fundamentals '+name+' markers');
 html=html.slice(0,from+start.length)+'\n'+fs.readFileSync(path.join(root,'assets/presentation/fundamentals.'+name),'utf8')+'\n'+html.slice(to);
}
fs.writeFileSync(file,html);
