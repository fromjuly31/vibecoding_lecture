const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {startBrowser}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));
fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8146,debugPort:9246,width:1600,height:1000});
 const show=id=>b.evaluate(`go(data.slides.findIndex(s=>s.id===${id}));finishSlideTransition()`);
 const fit=()=>b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),c=s.querySelector('.content-inner'),h=s.querySelector('.slide-content');return{height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
 try{
  await b.navigate(b.url+'/?ai-brands-qa','typeof data!=="undefined"');
  await b.evaluate('localStorage.clear();data=copy(DEFAULT);states={};current=14;renderAll()');
  assert.deepEqual(await b.evaluate('data.slides.slice(14,17).map(s=>[s.id,s.title,s.brand.company,s.brand.score])'),[[400,'ChatGPT','OpenAI','53'],[401,'Gemini','Google DeepMind','53'],[402,'Claude','Anthropic','58']]);
  assert.equal(await b.evaluate(`(()=>{const old=copy(V10_DEFAULT);old.slides[14].title='Edited ChatGPT';old.slides[14].notes='Saved notes';old.slides[14].items[0].example='Saved example';old.layouts={'400':{'text:title:0':{x:4,y:7,width:600}}};const n=validData(old);return n.version===11&&n.slides[14].title==='Edited ChatGPT'&&n.slides[14].notes==='Saved notes'&&n.slides[14].items[0].example==='Saved example'&&JSON.stringify(n.layouts)===JSON.stringify(old.layouts)&&old.slides.every(s=>[400,401,402,601].includes(s.id)||JSON.stringify(s)===JSON.stringify(n.slides.find(x=>x.id===s.id)))&&JSON.stringify(validData(n))===JSON.stringify(n)})()`),true);
  await b.evaluate('localStorage.setItem(storageKey,JSON.stringify(V10_DEFAULT))');
  await b.navigate(b.url+'/?ai-brands-migration','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.version===11&&!initialMessage&&data.slides[14].brand.score==="53"'),true);
  console.log('PASS pages 15–17, saved data migration, custom edits and unrelated slides');
  await b.evaluate('togglePresent(true)');
  for(const id of [400,401,402]){
   await show(id);
   const r=await fit();assert.ok(r.height<=r.available+1&&r.width<=r.availableWidth+1,JSON.stringify({id,...r}));
   await b.until('document.querySelector("#slideFrame .brand-logo")?.complete');
   assert.equal(await b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),img=s.querySelector('.brand-logo');return s.querySelectorAll('h1').length===1&&img.naturalWidth>0&&img.src.startsWith('data:image/')&&s.querySelectorAll('.brand-model').length===3&&s.querySelectorAll('.brand-source-links a[href^="https://"]').length===2&&!s.querySelector('.ai-example,.sibling-rail')&&!s.innerText.includes('이렇게 시작해')&&s.innerText.includes('2026.10.19')&&s.innerText.includes('v4.3.2')})()`),true);
   await b.screenshot('.qa/ai-brand-'+id+'.png');
  }
  await b.evaluate('toggleTheme()');
  for(const id of [400,401,402]){await show(id);await b.screenshot('.qa/ai-brand-dark-'+id+'.png');}
  await b.evaluate('toggleTheme()');
  console.log('PASS brand logos, model details, linked sources, distinct designs and desktop fit');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await b.evaluate('readingOverride=null;resizeStage()');
  for(const id of [400,401,402]){
   await show(id);await b.evaluate('resizeStage()');
   assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Mobile '+id);
   assert.equal(await b.evaluate(`(()=>{const title=document.querySelector('#slideFrame h1'),style=getComputedStyle(title);return title.scrollWidth<=title.clientWidth+1&&title.clientHeight<=parseFloat(style.lineHeight)+1})()`),true,'Mobile brand name must fit on one line '+id);
   await b.screenshot('.qa/ai-brand-mobile-'+id+'.png');
  }
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('togglePresent(false);resizeStage()');await show(400);
  await b.evaluate(`(()=>{const e=document.querySelector('#slideFrame [data-path$=".brand.models.0.name"]');e.focus();e.textContent='Edited model';e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));e.blur();saveNow()})()`);
  assert.equal(await b.evaluate('JSON.parse(localStorage.getItem(storageKey)).slides[14].brand.models[0].name'),'Edited model');
  await b.evaluate('data=copy(DEFAULT);states={};renderAll();buildPrint()');
  await b.cdp('Emulation.setEmulatedMedia',{media:'print'});
  for(const id of [400,401,402]){
   const r=await b.evaluate(`(()=>{const s=document.querySelector('#printRoot .slide[data-slide="'+data.slides.findIndex(s=>s.id===${id})+'"]'),c=s.querySelector('.content-inner'),h=s.querySelector('.slide-content');return{height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
   assert.ok(r.height<=r.available+1&&r.width<=r.availableWidth+1,JSON.stringify({print:id,...r}));
  }
  await b.cdp('Emulation.setEmulatedMedia',{media:''});
  console.log('PASS mobile fit, editable model names, autosave and print layout');
  await b.evaluate('window.__brandExport=null;window.__oldDownload=download;download=html=>window.__brandExport=html;exportHTML();download=window.__oldDownload');
  const length=await b.evaluate('window.__brandExport.length'),chunks=[];
  for(let i=0;i<length;i+=100000)chunks.push(await b.evaluate(`window.__brandExport.slice(${i},${i+100000})`));
  fs.writeFileSync('.qa/ai-brands-export.html',chunks.join(''));
  await b.navigate(b.url+'/.qa/ai-brands-export.html','typeof data!=="undefined"');
  await b.cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  for(const id of [400,401,402]){await show(id);await b.until('document.querySelector("#slideFrame .brand-logo")?.complete');assert.equal(await b.evaluate('document.querySelector("#slideFrame .brand-logo").naturalWidth>0'),true);}
  assert.deepEqual(b.errors,[]);
  console.log('PASS exported HTML includes all three logos offline; no runtime errors');
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
