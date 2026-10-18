const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {startBrowser,sleep}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));
fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8142,debugPort:9242,width:1600,height:1000});
 const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name)};
 const key=async(name,code)=>{await b.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:code});await b.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:code});};
 const show=async page=>{await b.evaluate(`go(${page-1});finishSlideTransition()`);};
 const fit=()=>b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),h=s.querySelector('.slide-content'),c=s.querySelector('.content-inner');return{overflow:s.classList.contains('content-overflow'),height:c.offsetHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
 const overlay=()=>b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),e=s.querySelector('.emphasis.is-shown'),q=e?.querySelector('.quote');if(!e)return null;const a=s.getBoundingClientRect(),r=e.getBoundingClientRect(),t=q.getBoundingClientRect();return{full:Math.abs(a.width-r.width)<1&&Math.abs(a.height-r.height)<1&&Math.abs(a.x-r.x)<1&&Math.abs(a.y-r.y)<1,center:Math.abs(t.x+t.width/2-a.x-a.width/2)<2&&Math.abs(t.y+t.height/2-a.y-a.height/2)<2,fits:t.left>=r.left&&t.right<=r.right&&t.top>=r.top&&t.bottom<=r.bottom,background:getComputedStyle(e).backgroundColor,ink:getComputedStyle(s).getPropertyValue('--ink').trim(),color:getComputedStyle(q).color,inert:[...s.children].filter(x=>x!==e).every(x=>x.inert)}})()`);
 try{
  await b.navigate(b.url+'/?qa','typeof data!=="undefined"');
  await b.evaluate('localStorage.clear()');
  await b.navigate(b.url+'/?qa-clean','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.version'),6);
  assert.equal(await b.evaluate('data.slides.length'),61);
  assert.deepEqual(await b.evaluate('data.slides.flatMap((s,i)=>s.takeaway?[i+1]:[])'),[5,9,13,26,27,28,53,56,58,61]);
  assert.deepEqual(await b.evaluate('[LEGACY_DEFAULT,V2_DEFAULT,V3_DEFAULT,V4_DEFAULT,V5_DEFAULT,DEFAULT].map(d=>{const v=validData(copy(d));return [v.version,v.slides.length]})'),Array.from({length:6},()=>[6,61]));
  assert.equal(await b.evaluate(`(()=>{const old=copy(V5_DEFAULT);old.meta.title='Saved title';old.slides[54].title='Saved UI title';old.slides[54].items[0].description='Saved definition';old.slides[54].notes='Saved notes';old.slides[54].takeaway='A distinct user idea';old.layouts={'1300':{'text:title:0':{x:7,y:9,width:650}}};const next=validData(old);return next.meta.title===old.meta.title&&next.slides[54].title===old.slides[54].title&&next.slides[54].items[0].description===old.slides[54].items[0].description&&next.slides[54].notes===old.slides[54].notes&&next.slides[54].takeaway===old.slides[54].takeaway&&JSON.stringify(next.layouts)===JSON.stringify(old.layouts)})()`),true);
  assert.equal(await b.evaluate(`(()=>{const old=copy(V5_DEFAULT),next=validData(old);return old.slides.every((s,i)=>s.type==='uiux'||JSON.stringify({...s,takeaway:undefined})===JSON.stringify({...next.slides[i],takeaway:undefined}))})()`),true);
  pass('61 slides preserved; versions 1–6 migrate; custom text/layouts retained; nine duplicate ideas removed');
  await b.evaluate('togglePresent(true)');
  for(let page=1;page<=61;page++){
   await show(page);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame>.slide")'),true);
   const expected=[5,9,13,26,27,28,53,56,58,61].includes(page);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .emphasis-trigger")'),expected,'Key idea page '+page);
  }
  pass('All slides render; plus buttons appear only on the final occurrence of each idea');
  for(const page of [55,56]){
   await show(page);const bounds=await fit();assert.equal(bounds.overflow,false,JSON.stringify(bounds));assert.ok(bounds.width<=bounds.availableWidth+1);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .score-app")'),false);
   await b.screenshot('.qa/polished-slide-'+page+'.png');
  }
  assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame .ux-journey-step").length'),3);
  pass('UI has an annotated interface; UX has a three-step journey; both fit the slide');
  await show(55);await key('ArrowRight',39);
  assert.equal(await b.evaluate('current'),55);
  await key('ArrowRight',39);assert.equal(await b.evaluate('current'),55);
  assert.equal(await b.evaluate('state(current).revealed'),true);
  await sleep(950);let panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits&&panel.inert,JSON.stringify(panel));
  await b.screenshot('.qa/polished-key-idea.png');
  await key('ArrowRight',39);assert.equal(await b.evaluate('current'),56);
  assert.equal(await b.evaluate('state(current).revealed'),false);
  pass('Right arrow skips removed duplicates, reveals the final idea, then advances');
  for(const page of [5,9,13,26,27,28,53,56,58,61]){
   await show(page);await b.evaluate('revealMessage();finishSlideTransition()');
   panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits&&panel.inert,'page '+page+' '+JSON.stringify(panel));
   await b.evaluate('hideMessage()');
   assert.equal(await b.evaluate('document.querySelector("#slideFrame>.slide>.slide-content").inert'),false);
  }
  pass('Every key idea fills the slide, centers its text, blocks the background and closes cleanly');
  await show(56);await b.evaluate('data.layouts["1301"]={"text:takeaway:0":{x:140,y:-80,width:500,fontSize:20}};renderCurrent();revealMessage();finishSlideTransition()');
  panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits);await b.evaluate('delete data.layouts["1301"];hideMessage()');
  await b.evaluate('toggleTheme();revealMessage();finishSlideTransition()');
  panel=await overlay();assert.equal(panel.background,'rgb(241, 242, 244)');assert.equal(panel.color,'rgb(23, 25, 30)');
  await b.screenshot('.qa/polished-key-idea-dark.png');
  await b.evaluate('hideMessage();toggleTheme()');
  await b.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await b.evaluate('revealMessage()');assert.equal(await b.evaluate('document.querySelector("#slideFrame>.slide").getAnimations({subtree:true}).length'),0);
  await b.evaluate('hideMessage()');await b.cdp('Emulation.setEmulatedMedia',{features:[]});
  pass('Color inversion works in both themes; saved offsets cannot displace statements; reduced motion is respected');
  await b.evaluate('document.querySelector("#slideFrame .emphasis-trigger").click()');assert.equal(await b.evaluate('state(current).revealed'),true);
  await b.evaluate('document.querySelector("#slideFrame .emphasis-copy").click()');assert.equal(await b.evaluate('current'),56);
  await show(58);await b.evaluate('finishSlideTransition()');
  const point=await b.evaluate('(()=>{const r=document.querySelector("#slideFrame").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:180,deltaX:0});await sleep(120);
  assert.equal(await b.evaluate('state(current).revealed'),true);assert.equal(await b.evaluate('current'),57);
  await sleep(1000);await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:180,deltaX:0});await sleep(120);assert.equal(await b.evaluate('current'),58);
  pass('Plus, slide click and mouse wheel retain the reveal-then-advance sequence');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await b.evaluate('readingOverride=null;resizeStage()');
  for(const page of [55,56]){await show(page);await b.evaluate('resizeStage()');assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await b.screenshot('.qa/polished-mobile-'+page+'.png');}
  await b.evaluate('revealMessage();finishSlideTransition();resizeStage()');panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits,JSON.stringify(panel));
  await b.screenshot('.qa/polished-mobile-key.png');
  pass('Mobile layouts and full-slide statement fit without horizontal overflow');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('togglePresent(false);go(54);finishSlideTransition();resizeStage()');
  assert.equal((await fit()).overflow,false);
  await b.evaluate(`(()=>{const el=document.querySelector('[data-path="slides.54.scene.heading"]');el.focus();el.textContent='Edited attendance heading';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  assert.equal(await b.evaluate('data.slides[54].scene.heading'),'Edited attendance heading');
  assert.equal(await b.evaluate('JSON.parse(localStorage.getItem(storageKey)).slides[54].scene.heading'),'Edited attendance heading');
  await b.evaluate('data=copy(DEFAULT);states={};renderAll();saveNow();buildPrint()');
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),61);
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-takeaway").length'),10);
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .emphasis").length'),0);
  const pdf=await b.cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,pageRanges:'55-56',transferMode:'ReturnAsStream'});
  const parts=[];for(;;){const chunk=await b.cdp('IO.read',{handle:pdf.stream,size:65536});parts.push(Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8'));if(chunk.eof)break;}await b.cdp('IO.close',{handle:pdf.stream});fs.writeFileSync('.qa/polished-uiux.pdf',Buffer.concat(parts));
  pass('New example text edits and autosaves; 61-page print layout includes each idea once; sample PDF generated');
  await b.evaluate('window.__qaDownload=null;window.__qaOriginalDownload=download;download=(html,type,name)=>window.__qaDownload={html,type,name};exportHTML();download=window.__qaOriginalDownload');
  const meta=await b.evaluate('({name:window.__qaDownload.name,length:window.__qaDownload.html.length})');assert.equal(meta.name,'index.html');
  const exportParts=[];for(let start=0;start<meta.length;start+=100000)exportParts.push(await b.evaluate(`window.__qaDownload.html.slice(${start},${start+100000})`));
  fs.writeFileSync('.qa/polished-export.html',exportParts.join(''));
  await b.navigate(b.url+'/.qa/polished-export.html','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.version'),6);assert.equal(await b.evaluate('data.slides[55].scene.steps.length'),3);
  await b.evaluate('go(55);togglePresent(true);revealMessage();finishSlideTransition()');panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits);
  pass('Exported standalone HTML retains the new content, migration and presentation effects');
  assert.deepEqual(b.errors,[]);pass('No browser runtime errors');
  fs.writeFileSync('.qa/presentation-polish-results.json',JSON.stringify({checks,errors:b.errors},null,2));
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
