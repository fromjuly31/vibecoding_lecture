const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {startBrowser,sleep}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));fs.mkdirSync('.qa',{recursive:true});
const expected=[150,154,155,500,502,801,806,...Array.from({length:13},(_,n)=>6200+n)];
(async()=>{
 const b=await startBrowser({port:8170,debugPort:9270,width:1600,height:1000});
 const show=id=>b.evaluate(`go(data.slides.findIndex(d=>d.id===${id}));finishSlideTransition()`);
 const click=selector=>b.evaluate(`document.querySelector(${JSON.stringify(selector)}).click();finishSlideTransition()`);
 const key=async(name,code)=>{
  await b.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:name,windowsVirtualKeyCode:code});
  await b.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:name,windowsVirtualKeyCode:code});
  await b.evaluate('finishSlideTransition()');
 };
 const snapshot=()=>b.evaluate(`(()=>{
  const s=panelSequence(),step=panelSequenceStep();if(!s)return {id:currentSlide().id};
  const visible=s.panels.map((p,n)=>getComputedStyle(p).display!=='none'?n:-1).filter(n=>n>=0);
  const hidden=s.panels.filter(p=>getComputedStyle(p).display==='none');
  return {id:currentSlide().id,step,visible,hiddenAccessible:hidden.some(p=>!p.inert||p.getAttribute('aria-hidden')!=='true')};
 })()`);
 const check=async(id,step)=>assert.deepEqual(await snapshot(),{id,step,visible:step===3?[0,1,2]:[step],hiddenAccessible:false});
 try{
  await b.navigate(b.url+'/?panel-sequence-qa','typeof data!=="undefined"');
  await b.evaluate('localStorage.clear();data=copy(DEFAULT);states={};current=0;togglePresent(true)');
  await b.evaluate('document.fonts.ready');
  assert.deepEqual(await b.evaluate(`data.slides.flatMap((d,i)=>{go(i);finishSlideTransition();return panelSequence()?[d.id]:[]})`),expected);
  for(const id of expected){
   await show(id);await check(id,0);
   for(let step=1;step<=3;step++){await click('#stageNext');await check(id,step);}
   const next=await b.evaluate('data.slides[current+1].id');await click('#presentNext');
   assert.equal(await b.evaluate('currentSlide().id'),next);
   await click('#presentPrev');await check(id,3);
   for(let step=2;step>=0;step--){await click('#stagePrev');await check(id,step);}
   const previous=await b.evaluate('data.slides[current-1].id');await click('#presentPrev');
   assert.equal(await b.evaluate('currentSlide().id'),previous);
   await show(id);await check(id,0);
  }
  console.log('PASS all 20 slides: first/second/third/overview, previous/next slide boundaries, hidden accessibility and direct-jump reset');

  await show(150);
  await key('ArrowRight',39);await check(150,1);
  await key(' ',32);await check(150,2);
  await key('PageDown',34);await check(150,3);
  await key('PageUp',33);await check(150,2);
  await key('ArrowLeft',37);await check(150,1);
  const point=await b.evaluate(`(()=>{const r=document.querySelector('#slideFrame').getBoundingClientRect();return {x:r.left+12,y:r.top+12}})()`);
  await b.cdp('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
  await b.cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});await check(150,2);
  await sleep(650);await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:120,deltaX:0});await sleep(80);await check(150,3);
  await sleep(650);await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:-120,deltaX:0});await sleep(80);await check(150,2);
  await click('#exitBtn');
  assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .panel-sequence-hidden")'),false);
  await click('#presentBtn');await check(150,0);
  await key('Home',36);assert.equal(await b.evaluate('current'),0);await show(150);await check(150,0);
  // Existing teaching interactions still work on slides outside the three-panel layouts.
  await show(700);await click('#presentNext');assert.equal(await b.evaluate('state(current).category'),'limits');
  await show(156);await click('#slideFrame [data-action=select][data-value="2"]');assert.equal(await b.evaluate('state(current).selected'),2);
  console.log('PASS keyboard, background click, wheel, presentation restart and existing database/data-flow interactions');

  for(const theme of ['light','dark']){
   await b.evaluate(`data.theme='${theme}';renderChrome()`);
   for(const id of expected){
    await show(id);
    for(let step=0;step<=3;step++){
     if(step)await click('#stageNext');await check(id,step);
     const fit=await b.evaluate(`(()=>{const {slide,panels}=panelSequence(),h=slide.querySelector('.slide-content'),c=slide.querySelector('.content-inner'),r=panels[panelSequenceStep()%3].getBoundingClientRect(),s=slide.getBoundingClientRect();return {height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth,center:Math.abs(r.left+r.width/2-s.left-s.width/2),overflow:slide.classList.contains('content-overflow')}})()`);
     assert.ok(fit.height<=fit.available+1&&fit.width<=fit.availableWidth+1&&!fit.overflow,JSON.stringify({id,step,theme,...fit}));
     if(step<3)assert.ok(fit.center<2,JSON.stringify({id,step,...fit}));
    }
   }
  }
  await b.evaluate('data.theme="light";renderChrome()');await show(150);
  await b.evaluate('document.querySelector("#presentNext").click()');assert.ok(await b.evaluate('transitionAnimations.size>0'));
  await b.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await click('#presentNext');await check(150,2);assert.equal(await b.evaluate('transitionAnimations.size'),0);
  await b.cdp('Emulation.setEmulatedMedia',{features:[]});
  console.log('PASS centered layouts without clipping in both themes, with animation and reduced motion');

  for(const id of expected){
   const movement=await b.evaluate(`(()=>{
    go(0);finishSlideTransition();go(data.slides.findIndex(d=>d.id===${id}));
    for(const a of transitionAnimations)a.pause();
    const panel=panelSequence().panels[0],animation=panel.getAnimations()[0],timing=animation.effect.getTiming();
    const bounds=()=>{const r=panel.getBoundingClientRect();return {center:r.x+r.width/2,width:r.width}};
    animation.currentTime=timing.delay;const start=bounds();
    animation.currentTime=timing.delay+timing.duration*.35;const middle=bounds();
    finishSlideTransition();const end=bounds();
    setPanelSequenceStep(2);finishSlideTransition();setPanelSequenceStep(3);
    for(const a of transitionAnimations){a.pause();a.currentTime=0}
    const centers=()=>panelSequence().panels.map(p=>{const r=p.getBoundingClientRect();return r.x+r.width/2});
    const gathered=centers();finishSlideTransition();const spread=centers();
    return {start,middle,end,gathered,spread};
   })()`);
   assert.ok(movement.start.center<movement.end.center-100,'Left column must travel to the center: '+id);
   assert.ok(movement.middle.center>movement.start.center&&movement.middle.center<movement.end.center+25,'Visible gathering movement: '+id);
   assert.ok(movement.start.width<movement.end.width*.8,'Gathering must enlarge the panel: '+id);
   assert.ok(Math.max(...movement.gathered)-Math.min(...movement.gathered)<2,'Overview must begin at a common center: '+id);
   assert.ok(movement.spread[1]-movement.spread[0]>100&&movement.spread[2]-movement.spread[1]>100,'Overview must spread into three columns: '+id);
  }
  await show(150);
  const right=await b.evaluate(`(()=>{
   setPanelSequenceStep(2);for(const a of transitionAnimations)a.pause();
   const p=panelSequence().panels[2],a=p.getAnimations()[0];a.currentTime=0;
   const before=p.getBoundingClientRect();finishSlideTransition();const after=p.getBoundingClientRect();
   return {start:before.x+before.width/2,end:after.x+after.width/2};
  })()`);
  assert.ok(right.start>right.end+100,'Third panel must move inward from the right');
  await b.evaluate('setPanelSequenceStep(1);setPanelSequenceStep(3);retreat();retreat();finishSlideTransition()');await check(150,1);
  assert.equal(await b.evaluate('document.querySelectorAll(".panel-motion-probe,.panel-motion-snapshot").length'),0);
  await b.evaluate('setPanelSequenceStep(2)');
  assert.equal(await b.evaluate('!!document.querySelector(".panel-motion-snapshot[aria-hidden=true][inert]")'),true);
  await b.evaluate('Promise.all([...transitionAnimations].map(a=>a.finished.catch(()=>{})))');
  await check(150,2);assert.equal(await b.evaluate('document.querySelectorAll(".panel-motion-snapshot").length'),0);
  await b.evaluate('setPanelSequenceStep(1);go(current+1);finishSlideTransition()');
  assert.equal(await b.evaluate('document.querySelectorAll(".panel-motion-probe,.panel-motion-snapshot").length'),0);
  console.log('PASS actual column-to-center travel, enlargement, centered spread, rapid reversal and natural/interrupted motion cleanup on all 20 layouts');

  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await b.evaluate('readingOverride=null;go(0);resizeStage()');
  for(const id of expected){
   await show(id);
   for(let step=0;step<=3;step++){
    if(step)await click('#stageNext');await check(id,step);
    assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.querySelector("#slideFrame").scrollWidth<=document.querySelector("#slideFrame").clientWidth+1'),true,'Mobile '+id+' step '+step);
   }
  }
  await show(150);await b.screenshot('.qa/panel-sequence-mobile.png');
  console.log('PASS all 80 mobile states without horizontal overflow');

  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('togglePresent(false);resizeStage()');await show(150);
  await b.evaluate(`editValue('slides.'+current+'.items.1.title','직접 수정한 두 번째 내용');saveNow()`);
  assert.equal(await b.evaluate('panelSequence().panels.every(p=>!p.inert&&getComputedStyle(p).display!=="none")'),true);
  await b.evaluate('togglePresent(true);advance();finishSlideTransition()');await check(150,1);
  assert.match(await b.evaluate('document.querySelector(".panel-sequence-active").textContent'),/직접 수정한/);
  await b.evaluate('buildPrint()');
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),73);
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .panel-sequence-hidden,#printRoot .panel-sequence-status").length'),0);
  assert.equal(await b.evaluate(`[...document.querySelectorAll('#printRoot .slide')].filter(s=>panelSequence(s)).every(s=>panelSequence(s).panels.length===3)`),true);
  // Export uses the original embedded HTML, so test the actual export and open it offline.
  const exported=await b.evaluate(`(()=>{let output;const original=download;download=(content)=>{output=content};try{exportHTML()}finally{download=original}return output})()`);
  const file=path.resolve('.qa/panel-sequence-export.html');fs.writeFileSync(file,exported);
  await b.navigate(pathToFileURL(file).href,'typeof data!=="undefined"');
  await b.evaluate('togglePresent(true)');await show(150);
  for(let step=0;step<=3;step++){if(step)await click('#stageNext');await check(150,step);}
  assert.match(await b.evaluate('panelSequence().panels[1].textContent'),/직접 수정한/);
  assert.equal(b.errors.length,0,b.errors.join('\n'));
  console.log('PASS editable content, 73 complete print pages and the self-contained offline HTML export');
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
