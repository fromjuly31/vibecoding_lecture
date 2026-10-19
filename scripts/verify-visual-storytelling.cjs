const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {startBrowser}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));
fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8144,debugPort:9244,width:1600,height:1000});
 const show=id=>b.evaluate(`go(data.slides.findIndex(s=>s.id===${id}));finishSlideTransition()`);
 const audit=()=>b.evaluate(`(()=>{const slide=document.querySelector('#slideFrame>.slide'),holder=slide.querySelector('.slide-content'),inner=slide.querySelector('.content-inner');return {id:currentSlide().id,title:currentSlide().title,height:inner.scrollHeight,available:holder.clientHeight,width:inner.scrollWidth,availableWidth:holder.clientWidth,h1:slide.querySelectorAll('h1').length}})()`);
 try{
  await b.navigate(b.url+'/?visual-qa','typeof data!=="undefined"');
  await b.evaluate('localStorage.clear();data=copy(DEFAULT);states={};current=0;renderAll()');
  assert.deepEqual(await b.evaluate('[LEGACY_DEFAULT,V2_DEFAULT,V3_DEFAULT,V4_DEFAULT,V5_DEFAULT,V6_DEFAULT,V7_DEFAULT,V8_DEFAULT,V9_DEFAULT,V10_DEFAULT,DEFAULT].map(d=>{const n=validData(copy(d));return[n.version,n.slides.length]})'),Array.from({length:11},()=>[11,63]));
  assert.equal(await b.evaluate(`(()=>{const old=copy(V9_DEFAULT);old.slides.find(s=>s.id===5100).title='Custom comparison';old.slides.find(s=>s.id===501).rows[0][1]='Custom observation';old.layouts={'5100':{'text:title:0':{x:7,y:9,width:800}}};const n=validData(old);return n.slides.find(s=>s.id===5100).title==='Custom comparison'&&n.slides.find(s=>s.id===501).rows[0][1]==='Custom observation'&&JSON.stringify(n.layouts)===JSON.stringify(old.layouts)&&JSON.stringify(validData(n))===JSON.stringify(n)})()`),true);
  assert.deepEqual(await b.evaluate('data.slides.filter(s=>s.part===3).map(s=>s.id)'),[9105,5098,5099,5100]);
  assert.deepEqual(await b.evaluate('data.slides.find(s=>s.id===5100).headers.slice(1)'),['Google Apps Script','GitHub','Netlify']);
  assert.equal(await b.evaluate(`!/앱스[ ]?스크립트|깃허브|넷리파이/.test(JSON.stringify(data.slides.filter(s=>s.part===3)))`),true);
  await b.evaluate('localStorage.setItem(storageKey,JSON.stringify(V9_DEFAULT))');
  await b.navigate(b.url+'/?visual-migration','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.version===11&&data.slides.length===63&&!initialMessage'),true);
  console.log('PASS all saved formats migrate; inserted slides, English names, edits and layouts survive');
  await b.evaluate('togglePresent(true)');
  const ids=[200,201,202,203,300,301,302,303,500,501,502,503,504,800,801,802,803,804,805,806,807,5098,5099,5100];
  const bounds=[];
  for(const id of ids){
   await show(id);const r=await audit();bounds.push(r);
   assert.ok(r.height<=r.available+1&&r.width<=r.availableWidth+1,JSON.stringify(r));
   assert.equal(r.h1,1,'One title per slide '+id);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .pictogram svg")'),true);
   if([200,300,500,501,801,804,5098,5099,5100].includes(id))await b.screenshot('.qa/visual-'+id+'.png');
  }
  assert.equal(await b.evaluate('new Set(data.slides.filter(s=>s.type===\'comparison\').map(comparisonStyle)).size'),6);
  await show(5100);
  assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame .deployment-row-3 td").length'),3);
  await show(200);await b.evaluate('document.querySelectorAll("#slideFrame .track-node")[2].click()');
  assert.equal(await b.evaluate('currentSlide().id'),202);
  await show(300);await b.evaluate('document.querySelectorAll("#slideFrame .track-node")[3].click()');
  assert.equal(await b.evaluate('currentSlide().id'),303);
  console.log('PASS content fits every redesigned slide; six comparison layouts and diagram navigation work');
  await b.evaluate('toggleTheme()');
  for(const id of [501,801,5098,5099,5100]){await show(id);await b.screenshot('.qa/visual-dark-'+id+'.png');}
  await b.evaluate('toggleTheme()');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await b.evaluate('readingOverride=null;resizeStage()');
  for(const id of ids){
   await show(id);await b.evaluate('resizeStage()');
   assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Mobile slide '+id);
  }
  await show(5099);await b.screenshot('.qa/visual-mobile-5099.png');
  console.log('PASS dark theme renders and every redesigned slide fits a 390px mobile viewport');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('togglePresent(false);resizeStage()');
  await show(5098);
  await b.evaluate(`(()=>{const el=document.querySelector('#slideFrame [data-path$=".definition"]');el.focus();el.textContent='Edited deployment definition';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  await b.navigate(b.url+'/?visual-edited','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.slides.find(s=>s.id===5098).definition'),'Edited deployment definition');
  await show(501);
  await b.evaluate(`(()=>{const el=document.querySelector('#slideFrame h1');el.focus();el.textContent='Edited side title';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  assert.equal(await b.evaluate('JSON.parse(localStorage.getItem(storageKey)).slides.find(s=>s.id===501).title'),'Edited side title');
  await b.evaluate('data=copy(DEFAULT);states={};current=0;renderAll();saveNow();buildPrint()');
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),63);
  await b.cdp('Emulation.setEmulatedMedia',{media:'print'});
  for(const id of ids){
   const r=await b.evaluate(`(()=>{const n=data.slides.findIndex(s=>s.id===${id}),s=document.querySelectorAll('#printRoot .print-page')[n].querySelector('.slide'),h=s.querySelector('.slide-content'),c=s.querySelector('.content-inner');return{id:${id},height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
   assert.ok(r.height<=r.available+1&&r.width<=r.availableWidth+1,'Print '+JSON.stringify(r));
  }
  await b.cdp('Emulation.setEmulatedMedia',{media:''});
  const pdf=await b.cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,pageRanges:'39-41',transferMode:'ReturnAsStream'});
  const chunks=[];for(;;){const r=await b.cdp('IO.read',{handle:pdf.stream,size:65536});chunks.push(Buffer.from(r.data,r.base64Encoded?'base64':'utf8'));if(r.eof)break;}await b.cdp('IO.close',{handle:pdf.stream});fs.writeFileSync('.qa/deployment-slides.pdf',Buffer.concat(chunks));
  assert.deepEqual(b.errors,[]);
  fs.writeFileSync('.qa/visual-storytelling-results.json',JSON.stringify({bounds,errors:b.errors},null,2));
  console.log('PASS new and moved text is editable and persists; all redesigned print pages fit; PDF generated; no runtime errors');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
