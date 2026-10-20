const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
for(const [extension,start,end,anchor]of[
 ['css','<style id="panel-sequence-style">','</style>','</head>'],
 ['js','/* PANEL_SEQUENCE_JS_START */','/* PANEL_SEQUENCE_JS_END */','const renderers=']
]){
 const content=fs.readFileSync(path.join(root,'assets/presentation/panel-sequence.'+extension),'utf8');
 const from=html.indexOf(start),to=html.indexOf(end,from+start.length);
 if(from>=0){
  if(to<0)throw Error('Missing panel sequence end marker');
  html=html.slice(0,from+start.length)+'\n'+content+'\n'+html.slice(to);
 }else{
  const at=html.indexOf(anchor);if(at<0)throw Error('Missing panel sequence insertion point');
  html=html.slice(0,at)+start+'\n'+content+'\n'+end+'\n'+html.slice(at);
 }
}
fs.writeFileSync(file,html);
