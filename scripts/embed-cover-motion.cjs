const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
for(const [ext,start,end,anchor]of [['css','<style id="cover-motion-style">','</style>','</head>'],['js','/* COVER_MOTION_JS_START */','/* COVER_MOTION_JS_END */','function renderCover(i,printing){']]){
 if(!html.includes(start)){assert.ok(html.includes(anchor));html=html.replace(anchor,start+'\n'+end+'\n'+anchor);}
 const from=html.indexOf(start),to=html.indexOf(end,from+start.length);assert.ok(from>=0&&to>from);
 html=html.slice(0,from+start.length)+'\n'+fs.readFileSync(path.join(root,'assets/presentation/cover-motion.'+ext),'utf8')+'\n'+html.slice(to);
}
fs.writeFileSync(file,html);
