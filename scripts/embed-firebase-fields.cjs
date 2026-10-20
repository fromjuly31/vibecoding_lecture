const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
const css=fs.readFileSync(path.join(root,'assets/presentation/firebase-fields.css'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/presentation/firebase-fields.js'),'utf8');
const images=Object.fromEntries(['mixed','simple'].map(key=>[key,'data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/firebase/firestore-'+key+'-fields.png')).toString('base64')]));
function embed(start,end,body,anchor){
 const from=html.indexOf(start),to=html.indexOf(end,from+start.length);
 if(from>=0&&to>=0)html=html.slice(0,from+start.length)+'\n'+body+'\n'+html.slice(to);
 else{
  if(!html.includes(anchor))throw Error('Missing anchor: '+anchor);
  html=html.replace(anchor,start+'\n'+body+'\n'+end+'\n'+anchor);
 }
}
embed('<style id="firebase-fields-style">','</style>',css,'</head>');
embed('/* FIREBASE_FIELDS_START */','/* FIREBASE_FIELDS_END */','const FIREBASE_SCREENSHOTS='+JSON.stringify(images)+';\n'+js,'function renderApiShowcaseSlide(i,printing){');
const embedded=/<script type="application\/json" id="embedded-data">([\s\S]*?)<\/script>/;
const data=JSON.parse(html.match(embedded)[1]);
if(data.version===13){
 const context={DEFAULT:structuredClone(data),copy:structuredClone};
 vm.runInNewContext(js,context);
 const json=JSON.stringify(context.DEFAULT).replace(/[<>&\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
 html=html.replace(embedded,()=>'<script type="application/json" id="embedded-data">'+json+'</script>');
}
fs.writeFileSync(file,html);
console.log('Embedded Firebase screenshots, slide data and presentation assets.');
