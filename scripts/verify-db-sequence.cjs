const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {startBrowser,sleep}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));
fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8156,debugPort:9256,width:1600,height:1000});
 const show=id=>b.evaluate(`go(data.slides.findIndex(s=>s.id===${id}));finishSlideTransition()`);
 const click=selector=>b.evaluate(`document.querySelector(${JSON.stringify(selector)}).click();finishSlideTransition()`);
 const snapshot=()=>b.evaluate('({id:currentSlide().id,step:state(current).category,revealed:state(current).revealed})');
 const check=async(id,step,revealed=false)=>assert.deepEqual(await snapshot(),{id,step,revealed});
 const key=async(key,code)=>{await b.cdp('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code});await b.cdp('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});await b.evaluate('finishSlideTransition()');};
 const fit=()=>b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),h=s.querySelector('.slide-content'),c=s.querySelector('.content-inner');return {height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
 try{
  await b.navigate(b.url+'/?db-sequence-qa','typeof data!=="undefined"&&!!document.querySelector("#slideFrame>.slide")');
  await b.evaluate('localStorage.clear();data=copy(DEFAULT);states={};current=0;renderAll()');
  assert.deepEqual(await b.evaluate('data.slides.slice(22,31).map(s=>s.id)'),[600,601,9003,7100,700,7101,701,7102,702]);
  assert.equal(await b.evaluate('data.slides.length'),66);
  assert.equal(await b.evaluate('data.version'),12);
  assert.deepEqual(await b.evaluate('data.slides.flatMap((s,i)=>s.type==="databaseIntro"?[[i+1,s.sourceId,data.slides[i+1].id]]:[])'),[[26,700,700],[28,701,701],[30,702,702]]);
  assert.equal(await b.evaluate('slideTitle(data.slides.find(s=>s.id===7100))'), 'Google Sheets · 소개');
  assert.equal(await b.evaluate(`[LEGACY_DEFAULT,V2_DEFAULT,V3_DEFAULT,V4_DEFAULT,V5_DEFAULT,V6_DEFAULT,V7_DEFAULT,V8_DEFAULT,V9_DEFAULT,V10_DEFAULT,V11_DEFAULT,DEFAULT].every(d=>{const n=validData(copy(d)),p=n.slides.find(s=>s.id===601);return n.slides.length===66&&p.segments[3]===DEFAULT.slides.find(s=>s.id===601).segments[3]&&JSON.stringify(validData(n))===JSON.stringify(n)})`),true);
  assert.equal(await b.evaluate(`(()=>{const old=copy(V10_DEFAULT),p=old.slides.find(s=>s.id===601);p.segments[3]='My saved design';p.elements[3].description='My design label';old.slides.find(s=>s.id===700).items[0].limits[0]='My saved limitation';old.layouts={'700':{'text:items.0.description:0':{x:3,y:4}}};const next=validData(old);return next.slides.find(s=>s.id===601).segments[3]===p.segments[3]&&next.slides.find(s=>s.id===601).elements[3].description===p.elements[3].description&&next.slides.find(s=>s.id===700).items[0].limits[0]==='My saved limitation'&&JSON.stringify(next.layouts)===JSON.stringify(old.layouts)})()`),true);
  await b.evaluate('localStorage.setItem(storageKey,JSON.stringify(V10_DEFAULT))');
  await b.navigate(b.url+'/?db-saved-migration','typeof data!=="undefined"');
  assert.equal(await b.evaluate('!initialMessage&&data.slides[23].segments[3]===DEFAULT.slides[23].segments[3]'),true);
  for(const id of [600,601]){await show(id);assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame [data-action=copy]").length'),0);}
  assert.match(await b.evaluate('data.slides[23].segments[3]'),/SUIT.*18px.*#F5F7FA.*#172033.*#355BFF.*24px/);
  console.log('PASS page numbering, prompt buttons, concrete design copy, saved-deck migration and custom edits');

  await show(700);await click('#nextBtn');await check(700,'limits');await click('#prevBtn');await check(700,'benefits');
  await click('#presentBtn');
  for(const id of [7100,7101,7102]){
   await show(id);
   assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame h1").length'),1);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .db-profile-description")&&!document.querySelector("#slideFrame .db-sequence,#slideFrame .emphasis")'),true);
   await click('#presentNext');await check(id-6400,'benefits');
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .db-description,#slideFrame .db-profile-description")'),false);
   await click('#presentPrev');assert.equal(await b.evaluate('currentSlide().id'),id);
  }
  console.log('PASS introductions precede each detail slide, retain shared descriptions and advance in one click');
  for(const id of [700,701,702]){
   await show(id);await check(id,'benefits');
   await click('#stageNext');await check(id,'limits');
   await click('#presentNext');await check(id,'usecases');
   await click('#presentNext');await check(id,'usecases',true);
   await click('#presentPrev');await check(id,'usecases');
   await click('#stagePrev');await check(id,'limits');
   await click('#presentPrev');await check(id,'benefits');
   await click('#slideFrame [data-action=category][data-value=limits]');await check(id,'limits');
   await click('#presentNext');await check(id,'usecases');
   await click('#presentNext');await click('#presentNext');
   assert.equal(await b.evaluate('currentSlide().id'),id===702?800:id+6401);
   if(id!==702)assert.equal(await b.evaluate('currentSlide().type'),'databaseIntro');
   await click('#presentPrev');await check(id,'usecases');
  }
  await show(700);
  await key('ArrowRight',39);await check(700,'limits');
  await key(' ',32);await check(700,'usecases');
  await key('ArrowLeft',37);await check(700,'limits');
  await key('PageUp',33);await check(700,'benefits');
  await key('PageDown',34);await check(700,'limits');
  await b.evaluate('document.getElementById("slideFrame").focus()');
  const point=await b.evaluate('(()=>{const r=document.querySelector("#slideFrame").getBoundingClientRect();return {x:r.x+10,y:r.y+10}})()');
  await sleep(650);await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:120,deltaX:0});await sleep(100);await check(700,'usecases');
  await sleep(650);await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:-120,deltaX:0});await sleep(100);await check(700,'limits');
  await b.cdp('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await b.cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});await check(700,'usecases');
  await click('#presentHome');assert.equal(await b.evaluate('current'),0);await show(700);await check(700,'benefits');
  await b.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await click('#presentNext');await check(700,'limits');assert.equal(await b.evaluate('transitionAnimations.size'),0);
  await b.cdp('Emulation.setEmulatedMedia',{features:[]});
  console.log('PASS next/previous controls, direct category selection, keyboard, wheel, background click, restart and reduced motion');

  for(const theme of ['light','dark']){
   await b.evaluate(`data.theme='${theme}';renderChrome()`);
   for(const id of [600,601,7100,700,7101,701,7102,702]){
    await show(id);const colors=[];
    for(const step of [700,701,702].includes(id)?['benefits','limits','usecases']:[null]){
     if(step)await b.evaluate(`setDatabaseStep('${step}');finishSlideTransition()`);
     const bounds=await fit();assert.ok(bounds.height<=bounds.available+1&&bounds.width<=bounds.availableWidth+1,JSON.stringify({id,step,theme,...bounds}));
     if(step)colors.push(await b.evaluate('getComputedStyle(document.querySelector(".db-stage")).backgroundColor'));
     if(id===601||id===700||id>=7100)await b.screenshot('.qa/db-sequence-'+theme+'-'+id+'-'+(step||'intro')+'.png');
    }
    if(colors.length)assert.equal(new Set(colors).size,3);
   }
  }
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  for(const id of [600,601,7100,700,7101,701,7102,702]){
   await show(id);
   for(const step of [700,701,702].includes(id)?['benefits','limits','usecases']:[null]){
    if(step)await b.evaluate(`setDatabaseStep('${step}');finishSlideTransition()`);
    await b.evaluate('resizeStage()');
    assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.querySelector("#slideFrame").scrollWidth<=document.querySelector("#slideFrame").clientWidth+1'),true,'Mobile '+id+' '+step);
   }
  }
  await show(700);await b.screenshot('.qa/db-sequence-mobile.png');
  await show(7102);await b.screenshot('.qa/db-intro-mobile.png');
  console.log('PASS light/dark colors, slide fit and mobile layout');

  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('togglePresent(false);data.theme="light";renderChrome();resizeStage()');
  await show(700);await click('#nextBtn');
  await b.evaluate(`(()=>{const el=document.querySelector('#slideFrame [data-path$=".limits.0"]');el.focus();el.textContent='Saved DB limitation';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  await show(601);
  await b.evaluate(`(()=>{const el=document.querySelector('#slideFrame [data-path$=".segments.3"]');el.focus();el.textContent='Saved design prompt';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  await show(7100);
  await b.evaluate(`(()=>{const el=document.querySelector('#slideFrame [data-path$=".items.0.description"]');el.focus();el.textContent='Saved database introduction';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  await b.navigate(b.url+'/?db-edits','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.slides[23].segments[3]'), 'Saved design prompt');
  assert.equal(await b.evaluate('data.slides.find(s=>s.id===700).items[0].limits[0]'),'Saved DB limitation');
  await show(7100);assert.equal(await b.evaluate('document.querySelector("#slideFrame .db-profile-description").textContent'),'Saved database introduction');
  await b.evaluate('data=copy(DEFAULT);states={};current=0;renderAll();saveNow();buildPrint()');
  await b.cdp('Emulation.setEmulatedMedia',{media:'print'});
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),66);
  for(const id of [600,601,7100,700,7101,701,7102,702]){
   const index=await b.evaluate(`data.slides.findIndex(s=>s.id===${id})`);
   const result=await b.evaluate(`(()=>{const s=document.querySelectorAll('#printRoot .print-page')[${index}].querySelector('.slide'),h=s.querySelector('.slide-content'),c=s.querySelector('.content-inner');return {height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth,copy:s.querySelectorAll('[data-action=copy]').length,sections:s.querySelectorAll('.backend-evidence>div').length}})()`);
   assert.ok(result.height<=result.available+1&&result.width<=result.availableWidth+1,JSON.stringify({index,...result}));
   assert.equal(result.copy,0);if([700,701,702].includes(id))assert.equal(result.sections,3);
  }
  assert.deepEqual(b.errors,[]);
  console.log('PASS canvas edits persist; PDF retains all three categories; no browser errors');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
