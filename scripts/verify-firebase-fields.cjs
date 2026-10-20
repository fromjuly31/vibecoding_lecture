const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {startBrowser,sleep}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));
fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8158,debugPort:9258,width:1600,height:1000});
 const show=id=>b.evaluate(`go(data.slides.findIndex(s=>s.id===${id}));finishSlideTransition()`);
 try{
  await b.navigate(b.url+'/?firebase-fields-qa','typeof data!=="undefined"&&!!document.querySelector("#slideFrame>.slide")');
  await b.evaluate('localStorage.clear()');
  await b.navigate(b.url+'/?firebase-fields-clean','typeof data!=="undefined"');
  assert.equal(await b.evaluate('initialMessage'),'');
  const embeddedCount=await b.evaluate('JSON.parse(document.querySelector("#embedded-data").textContent).slides.length');
  assert.equal(await b.evaluate('data.slides.length'),embeddedCount);
  assert.equal(await b.evaluate('data.slides[37].title'),'Firebase · 특징');
  assert.deepEqual(await b.evaluate('data.slides.slice(36,40).map(s=>s.id)'),[7102,7103,702,800]);
  assert.equal(await b.evaluate(`[LEGACY_DEFAULT,V2_DEFAULT,V3_DEFAULT,V4_DEFAULT,V5_DEFAULT,V6_DEFAULT,V7_DEFAULT,V8_DEFAULT,V9_DEFAULT,V10_DEFAULT,V11_DEFAULT,V12_DEFAULT,V13_DEFAULT,DEFAULT].every(old=>{const d=validData(copy(old));return d.version===14&&d.slides.length===74&&JSON.stringify(validData(d))===JSON.stringify(d)})`),true);
  // Saved text, layout and deleted slides must survive insertion into older decks.
  assert.equal(await b.evaluate(`(()=>{
   const old=copy(V13_DEFAULT);old.slides[0].presenter='Saved presenter';
   old.layouts={'702':{'text:takeaway:0':{x:7,y:11}}};
   const index=old.slides.findIndex(s=>s.id===800),[removed]=old.slides.splice(index,1);
   old.trash=[{slide:removed,index,beforeId:702,afterId:801}];
   const next=validData(old);
   return next.slides[0].presenter==='Saved presenter'&&JSON.stringify(next.layouts)===JSON.stringify(old.layouts)&&next.trash[0].slide.id===800&&next.trash[0].index===index+1&&next.slides[37].id===7103&&JSON.stringify(validData(next))===JSON.stringify(next);
  })()`),true);
  await b.evaluate(`data=copy(V13_DEFAULT);saveNow()`);
  await b.navigate(b.url+'/?firebase-fields-saved','typeof data!=="undefined"');
  assert.equal(await b.evaluate('!initialMessage&&data.slides[37].id===7103'),true);
  // A browser may have saved the first version before the requested title change.
  await b.evaluate(`(()=>{const saved=copy(data),slide=saved.slides.find(s=>s.id===7103);slide.title='필드가 달라도, 같은 DB에 저장합니다';slide.focusLabel='Add field = 항목 추가';saved.slides[0].presenter='Keep my saved edit';data=saved;saveNow()})()`);
  await b.navigate(b.url+'/?firebase-fields-title-refresh','typeof data!=="undefined"');
  await show(7103);
  assert.equal(await b.evaluate('document.querySelector("#slideFrame h1").textContent'),'Firebase · 특징');
  assert.equal(await b.evaluate('document.querySelector("#slideNav [data-slide-id=\\"7103\\"] .nav-title").textContent'),'Firebase · 특징');
  assert.equal(await b.evaluate(`(()=>{const saved=copy(data);saved.slides.find(s=>s.id===7103).title='파이어베이스 - 특징';return validData(saved).slides.find(s=>s.id===7103).title})()`),'Firebase · 특징');
  assert.equal(await b.evaluate('data.slides[0].presenter'),'Keep my saved edit');
  assert.equal(await b.evaluate(`(()=>{const saved=copy(data);saved.slides.find(s=>s.id===7103).title='My custom title';return validData(saved).slides.find(s=>s.id===7103).title})()`),'My custom title');
  console.log('PASS previously saved title refreshes in both slide and sidebar; other edits remain intact');
  await b.evaluate(`localStorage.clear();data=validData(JSON.parse(document.querySelector('#embedded-data').textContent));states={};current=0;renderAll()`);
  console.log('PASS slide 38 placement, title, all prior formats and saved edits/trash migration');
  await show(7102);
  await b.evaluate('togglePresent(true);finishSlideTransition();document.querySelector("#presentNext").click();finishSlideTransition()');
  assert.equal(await b.evaluate('currentSlide().id'),7103);
  await b.evaluate('document.querySelector("#presentNext").click();finishSlideTransition()');
  assert.equal(await b.evaluate('currentSlide().id'),702);
  await b.evaluate('document.querySelector("#presentPrev").click();finishSlideTransition()');
  assert.equal(await b.evaluate('currentSlide().id'),7103);
  for(const theme of ['light','dark']){
   await b.evaluate(`data.theme='${theme}';renderChrome();resizeStage();finishSlideTransition()`);
   await b.until('[...document.querySelectorAll("#slideFrame .firestore-screen img")].every(img=>img.complete&&img.naturalWidth===1024)');
   assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame .firestore-field-highlight").length'),7);
   assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame .firestore-add-highlight").length'),0);
   const bounds=await b.evaluate(`(()=>{const slide=document.querySelector('#slideFrame>.slide'),inner=slide.querySelector('.content-inner'),holder=slide.querySelector('.slide-content');return {width:inner.scrollWidth,availableWidth:holder.clientWidth,height:inner.scrollHeight,availableHeight:holder.clientHeight,overflow:slide.classList.contains('content-overflow')}})()`);
   assert.ok(bounds.width<=bounds.availableWidth&&bounds.height<=bounds.availableHeight,JSON.stringify(bounds));
   assert.equal(bounds.overflow,false);
   await b.screenshot('.qa/firebase-fields-'+theme+'.png');
  }
  console.log('PASS introduction/comparison/details navigation, light/dark fit and embedded screenshots');
  await b.evaluate('togglePresent(false);data.theme="light";renderChrome()');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await b.evaluate('resizeStage();finishSlideTransition()');
  await sleep(100);
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await b.screenshot('.qa/firebase-fields-mobile.png');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('resizeStage();buildPrint()');
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),embeddedCount);
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot [data-type=firebaseFields] img").length'),2);
  // The exported HTML must work on its own, without the assets directory.
  const exported=await b.evaluate(`(()=>{let result='';const old=download;download=(content)=>result=content;try{exportHTML()}finally{download=old}return result})()`);
  fs.writeFileSync('.qa/firebase-fields-export.html',exported);
  await b.navigate(b.url+'/.qa/firebase-fields-export.html','typeof data!=="undefined"');
  await show(7103);
  assert.equal(await b.evaluate('initialMessage'),'');
  await b.until('[...document.querySelectorAll("#slideFrame .firestore-screen img")].every(img=>img.complete&&img.naturalWidth===1024)');
  assert.equal(await b.evaluate('data.slides[37].title'),'Firebase · 특징');
  assert.deepEqual(b.errors,[]);
  console.log('PASS mobile, print, self-contained HTML export and no browser exceptions');
 }finally{await b.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
