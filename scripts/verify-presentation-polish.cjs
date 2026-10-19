const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {startBrowser,sleep}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));
fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8142,debugPort:9242,width:1600,height:1000});
 const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name)};
 const key=async(name,code)=>{await b.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:code});await b.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:code});};
 let legacyIds=[];
 const show=async page=>{await b.evaluate(`go(data.slides.findIndex(s=>s.id===${legacyIds[page-1]}));finishSlideTransition()`);};
 const fit=()=>b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),h=s.querySelector('.slide-content'),c=s.querySelector('.content-inner');return{overflow:s.classList.contains('content-overflow'),height:c.offsetHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
 const overlay=()=>b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),e=s.querySelector('.emphasis.is-shown'),q=e?.querySelector('.quote');if(!e)return null;const a=s.getBoundingClientRect(),r=e.getBoundingClientRect(),t=q.getBoundingClientRect();return{full:Math.abs(a.width-r.width)<1&&Math.abs(a.height-r.height)<1&&Math.abs(a.x-r.x)<1&&Math.abs(a.y-r.y)<1,center:Math.abs(t.x+t.width/2-a.x-a.width/2)<2&&Math.abs(t.y+t.height/2-a.y-a.height/2)<2,fits:t.left>=r.left&&t.right<=r.right&&t.top>=r.top&&t.bottom<=r.bottom,background:getComputedStyle(e).backgroundColor,ink:getComputedStyle(s).getPropertyValue('--ink').trim(),color:getComputedStyle(q).color,inert:[...s.children].filter(x=>x!==e).every(x=>x.inert)}})()`);
 try{
  await b.navigate(b.url+'/?qa','typeof data!=="undefined"');
  await b.evaluate('localStorage.clear()');
  await b.navigate(b.url+'/?qa-clean','typeof data!=="undefined"');
  legacyIds=await b.evaluate('V9_DEFAULT.slides.map(s=>s.id)');
  assert.equal(await b.evaluate('data.version'),10);
  assert.equal(await b.evaluate('data.slides.length'),63);
  assert.deepEqual(await b.evaluate('data.slides.flatMap(s=>s.takeaway?[s.id]:[])'),[101,203,303,700,701,702,5100,1301,1401,16]);
  assert.deepEqual(await b.evaluate('[LEGACY_DEFAULT,V2_DEFAULT,V3_DEFAULT,V4_DEFAULT,V5_DEFAULT,V6_DEFAULT,V7_DEFAULT,V8_DEFAULT,V9_DEFAULT,DEFAULT].map(d=>{const v=validData(copy(d));return [v.version,v.slides.length]})'),Array.from({length:10},()=>[10,63]));
  assert.equal(await b.evaluate(`(()=>{const old=copy(V5_DEFAULT);old.meta.title='Saved title';old.slides.find(s=>s.id===1300).title='Saved UI title';old.slides.find(s=>s.id===1300).items[0].description='Saved definition';old.slides.find(s=>s.id===1300).notes='Saved notes';old.slides.find(s=>s.id===1300).takeaway='A distinct user idea';old.layouts={'1300':{'text:title:0':{x:7,y:9,width:650}}};const next=validData(old);return next.meta.title===old.meta.title&&next.slides.find(s=>s.id===1300).title===old.slides.find(s=>s.id===1300).title&&next.slides.find(s=>s.id===1300).items[0].description===old.slides.find(s=>s.id===1300).items[0].description&&next.slides.find(s=>s.id===1300).notes===old.slides.find(s=>s.id===1300).notes&&next.slides.find(s=>s.id===1300).takeaway===old.slides.find(s=>s.id===1300).takeaway&&JSON.stringify(next.layouts)===JSON.stringify(old.layouts)})()`),true);
  assert.equal(await b.evaluate(`(()=>{const old=copy(V6_DEFAULT),next=validData(old);return old.slides.every(s=>s.part===2||[1300,1301,1400,1401,16,9105,5100].includes(s.id)||JSON.stringify({...s,part:s.part===3?4:s.part===4?3:s.part})===JSON.stringify(next.slides.find(x=>x.id===s.id)))})()`),true);
  assert.equal(await b.evaluate(`(()=>{const old=copy(V6_DEFAULT);old.meta.parts[0]='Saved chapter';old.slides.find(s=>s.id===16).items[4].description='Saved summary';const next=validData(old);return next.meta.parts[0]==='Saved chapter'&&next.slides.find(s=>s.id===16).items[5].description==='Saved summary'&&next.slides.find(s=>s.id===16).items.length===6})()`),true);
  assert.equal(await b.evaluate(`(()=>{const old=copy(V7_DEFAULT);old.slides.find(s=>s.id===1301).title='Custom UX title';old.slides.find(s=>s.id===1301).example.beforeNote='Custom search note';old.slides.find(s=>s.id===1401).takeaway='Custom final idea';const next=validData(old);return next.slides.find(s=>s.id===1301).title==='Custom UX title'&&next.slides.find(s=>s.id===1301).example.beforeNote==='Custom search note'&&next.slides.find(s=>s.id===1401).takeaway==='Custom final idea'&&old.slides.every(s=>s.part===2||[1301,1400,1401,16,9105,5100].includes(s.id)||JSON.stringify({...s,part:s.part===3?4:s.part===4?3:s.part})===JSON.stringify(next.slides.find(x=>x.id===s.id)))})()`),true);
  pass('63 slides; existing slides preserved; versions 1–10 migrate; custom text/layouts retained; unrelated slides unchanged');
  assert.deepEqual(await b.evaluate('data.meta.parts.slice(2,5)'),['목적에 맞는 DB 선택','웹앱의 배포 방식','API로 기능 확장하기']);
  assert.deepEqual(await b.evaluate('data.slides.filter(s=>s.type===\'section\').map(s=>s.part)'),[0,1,2,3,4,5,6]);
  assert.equal(await b.evaluate(`data.slides.every((s,i)=>!i||s.part>=data.slides[i-1].part)&&data.slides.filter(s=>s.type==='apiShowcase').every(s=>s.part===4)&&data.slides.find(s=>s.id===5100).part===3`),true);
  assert.equal(await b.evaluate(`!JSON.stringify(data.slides.filter(s=>s.part===2)).includes('백엔드')&&data.slides.find(s=>s.id===700).title==='Google Sheets'&&data.slides.find(s=>s.id===16).items.every((item,n)=>item.title===data.meta.parts[n])`),true);
  assert.equal(await b.evaluate(`(()=>{const old=copy(V8_DEFAULT);old.meta.parts[3]='Custom API chapter';old.slides.find(s=>s.id===700).items[0].description='Custom storage description';old.slides.find(s=>s.id===16).items[3].description='Custom API summary';old.slides.find(s=>s.id===9105).notes='Custom deployment notes';old.layouts={'6200':{'text:title:0':{x:14,width:600}}};const next=validData(old);return next.meta.parts[4]==='Custom API chapter'&&next.slides.find(s=>s.id===700).items[0].description==='Custom storage description'&&next.slides.find(s=>s.id===16).items[4].description==='Custom API summary'&&next.slides.find(s=>s.id===9105).notes==='Custom deployment notes'&&JSON.stringify(next.layouts)===JSON.stringify(old.layouts)&&JSON.stringify(validData(next))===JSON.stringify(next)})()`),true);
  await b.evaluate('localStorage.setItem(storageKey,JSON.stringify(V8_DEFAULT))');
  await b.navigate(b.url+'/?qa-migration','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.version===10&&!initialMessage&&data.meta.parts[3]===\'웹앱의 배포 방식\''),true);
  for(const [part,id]of [[2,9003],[3,9105],[4,9004]]){
   await b.evaluate(`go(1);finishSlideTransition();document.querySelector('#slideFrame [data-action="part-jump"][data-value="${part}"]').click();finishSlideTransition()`);
   assert.equal(await b.evaluate('currentSlide().id'),id);
  }
  pass('DB copy, chapter order, contents links and saved-deck upgrades match; API edits and layouts follow their slides');
  await b.evaluate('togglePresent(true)');
  for(let page=1;page<=61;page++){
   await show(page);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame>.slide")'),true);
   const expected=[5,9,13,26,27,28,39,56,58,61].includes(page);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .emphasis-trigger")'),expected,'Key idea page '+page);
  }
  pass('All slides render; plus buttons appear only on the final occurrence of each idea');
  for(const id of [9010,9003,700,701,702,800,801,802,803,804,805,806,807,9,9105,5100]){
   await b.evaluate(`go(data.slides.findIndex(s=>s.id===${id}));finishSlideTransition()`);
   const bounds=await fit();assert.ok(bounds.height<=bounds.available+1,'Slide '+id+' '+JSON.stringify(bounds));assert.ok(bounds.width<=bounds.availableWidth+1);
   if([9010,700,5100].includes(id))await b.screenshot('.qa/reordered-slide-'+id+'.png');
  }
  pass('Updated roadmap, DB slides and deployment slides fit the presentation');
  for(const page of [55,56,57,58,61]){
   await show(page);const bounds=await fit();assert.equal(bounds.overflow,false,JSON.stringify(bounds));assert.ok(bounds.width<=bounds.availableWidth+1);
   assert.equal(await b.evaluate('!!document.querySelector("#slideFrame .score-app")'),false);
   await b.screenshot('.qa/polished-slide-'+page+'.png');
  }
  await show(55);
  assert.equal(await b.evaluate(`(()=>{const screens=[...document.querySelectorAll('#slideFrame .attendance-example')];return screens.length===2&&screens[0].textContent===screens[1].textContent&&getComputedStyle(screens[0].querySelector('.attendance-title>strong')).fontSize!==getComputedStyle(screens[1].querySelector('.attendance-title>strong')).fontSize})()`),true);
  await show(56);
  assert.equal(await b.evaluate('currentSlide().title'),'UX. 얼마나 쉽고 편리하게 쓰는가');
  assert.match(await b.evaluate('document.querySelector("#slideFrame .example-task").textContent'),/사용자 경험.*편리함과 만족감/);
  assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame [data-lookup-list=all] .lookup-row").length'),180);
  assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame [data-lookup-list=search] .lookup-row").length'),1);
  const search=async value=>b.evaluate(`(()=>{const input=document.querySelector('#slideFrame [data-lookup-search]');input.focus();input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));return document.querySelectorAll('#slideFrame [data-lookup-list=search] .lookup-row').length})()`);
  assert.equal(await search(''),180);assert.equal(await search('김'),18);assert.equal(await search('없는이름'),0);assert.equal(await search('김서연'),1);
  await key('ArrowRight',39);assert.equal(await b.evaluate('currentSlide().id'),1301);assert.equal(await b.evaluate('state(current).revealed'),false);
  await b.evaluate(`document.querySelector('#slideFrame [data-lookup-list=search] .lookup-row').click()`);
  assert.match(await b.evaluate(`document.querySelector('#slideFrame [data-lookup-result=search]').textContent`),/김서연.*18번/);
  const listPoint=await b.evaluate(`(()=>{const el=document.querySelector('#slideFrame [data-lookup-list=all]');el.scrollTop=el.scrollHeight;const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...listPoint,deltaY:180,deltaX:0});await sleep(100);
  assert.equal(await b.evaluate('currentSlide().id'),1301);assert.equal(await b.evaluate('state(current).revealed'),false);
  await b.evaluate('document.activeElement.blur()');
  pass('UI compares the same data visually; UX searches 180 students, handles empty results and keeps list scrolling within the slide');
  await show(57);
  assert.equal(await b.evaluate('currentSlide().title'),'UI 개선 전·후');
  assert.equal(await b.evaluate(`(()=>{const apps=[...document.querySelectorAll('#slideFrame .lesson-app')];return apps.length===2&&apps[0].textContent===apps[1].textContent&&getComputedStyle(apps[0].querySelector('.save')).backgroundColor!==getComputedStyle(apps[1].querySelector('.save')).backgroundColor&&apps.every(a=>a.querySelectorAll('.lesson-action').length===3)})()`),true);
  assert.match(await b.evaluate(`document.querySelector('#slideFrame .teacher-prompt').textContent`),/AI에게 요청.*저장 버튼을 강조/);
  await show(58);assert.equal(await b.evaluate('currentSlide().title'),'UX 개선 전·후');
  await b.evaluate(`document.querySelector('#slideFrame [data-feedback-save="before"]').click()`);
  assert.equal(await b.evaluate(`document.querySelector('#slideFrame [data-feedback-status="before"]').textContent`),'');
  await b.evaluate(`document.querySelector('#slideFrame [data-feedback-save="after"]').click();document.querySelector('#slideFrame [data-feedback-save="after"]').click()`);
  assert.equal(await b.evaluate(`document.querySelector('#slideFrame [data-feedback-save="after"]').disabled`),true);
  assert.equal(await b.evaluate(`document.querySelector('#slideFrame [data-feedback-status="after"]').textContent`),'저장 중…');
  await b.until(`!document.querySelector('#slideFrame [data-feedback-save="after"]').disabled`);
  assert.equal(await b.evaluate(`document.querySelector('#slideFrame [data-feedback-status="after"]').textContent`),'저장되었습니다.');
  assert.equal(await b.evaluate('currentSlide().id'),1401);assert.equal(await b.evaluate('state(current).revealed'),false);
  assert.equal(await b.evaluate('document.querySelector("#slideFrame").textContent.includes("과제")'),false);
  pass('UI compares action emphasis on identical screens; UX demonstrates saving feedback and prevents duplicate clicks');
  await show(38);assert.equal(await b.evaluate('document.querySelector("#slideFrame .chapter-title").textContent'),'웹앱의 배포 방식');
  await show(61);
  assert.deepEqual(await b.evaluate('[...document.querySelectorAll("#slideFrame .summary-terms strong")].map(el=>el.textContent)'),await b.evaluate('data.meta.parts.slice(0,6)'));
  for(let n=0;n<6;n++){await b.evaluate(`document.querySelectorAll('#slideFrame .summary-terms button')[${n}].click()`);assert.equal(await b.evaluate('document.querySelector("#slideFrame .summary-definition h2").textContent'),await b.evaluate(`data.slides.find(s=>s.id===16).items[${n}].description`));}
  assert.equal(await b.evaluate(`(()=>{const old=data.meta.parts[4];data.meta.parts[4]='Updated chapter';renderCurrent();const ok=document.querySelectorAll('#slideFrame .summary-terms strong')[4].textContent==='Updated chapter';data.meta.parts[4]=old;return ok})()`),true);
  pass('Chapter 4 covers deployment; final summary covers all six chapters and follows shared chapter titles');
  await show(55);await key('ArrowRight',39);
  assert.equal(await b.evaluate('currentSlide().id'),1301);
  await key('ArrowRight',39);assert.equal(await b.evaluate('currentSlide().id'),1301);
  assert.equal(await b.evaluate('state(current).revealed'),true);
  await sleep(950);let panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits&&panel.inert,JSON.stringify(panel));
  await b.screenshot('.qa/polished-key-idea.png');
  await key('ArrowRight',39);assert.equal(await b.evaluate('currentSlide().id'),1400);
  assert.equal(await b.evaluate('state(current).revealed'),false);
  pass('Right arrow skips removed duplicates, reveals the final idea, then advances');
  for(const page of [5,9,13,26,27,28,39,56,58,61]){
   await show(page);await b.evaluate('revealMessage();finishSlideTransition()');
   panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits&&panel.inert,'page '+page+' '+JSON.stringify(panel));
   await b.evaluate('hideMessage()');
   assert.equal(await b.evaluate('document.querySelector("#slideFrame>.slide>.slide-content").inert'),false);
  }
  pass('Every key idea fills the slide, centers its text, blocks the background and closes cleanly');
  await show(56);await b.evaluate('data.layouts["1301"]={"text:takeaway:0":{x:140,y:-80,width:500,fontSize:20}};renderCurrent();revealMessage();finishSlideTransition()');
  panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits);await b.evaluate('delete data.layouts["1301"];hideMessage()');
  await b.evaluate('toggleTheme();revealMessage();finishSlideTransition()');
  panel=await overlay();assert.equal(panel.background,'rgb(237, 243, 255)');assert.equal(panel.color,'rgb(35, 49, 76)');
  assert.equal(await b.evaluate('getComputedStyle(document.querySelector("#slideFrame .idea-accent")).color'),'rgb(41, 78, 216)');
  await b.screenshot('.qa/polished-key-idea-dark.png');
  await b.evaluate('hideMessage();toggleTheme()');
  await b.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await b.evaluate('revealMessage()');assert.equal(await b.evaluate('document.querySelector("#slideFrame>.slide").getAnimations({subtree:true}).length'),0);
  await b.evaluate('hideMessage()');await b.cdp('Emulation.setEmulatedMedia',{features:[]});
  assert.equal(await b.evaluate(`(()=>{const old=data.slides.find(s=>s.id===1301).takeaway;data.slides.find(s=>s.id===1301).takeaway='<img src=x onerror=alert(1)>\\nA custom message';renderCurrent();revealMessage();finishSlideTransition();const el=document.querySelector('#slideFrame .quote');const ok=!el.querySelector('img')&&el.querySelector('mark').textContent==='A custom message';hideMessage();data.slides.find(s=>s.id===1301).takeaway=old;renderCurrent();return ok})()`),true);
  pass('Accent colors work in both themes; custom messages are escaped; saved offsets and reduced motion are respected');
  await b.evaluate('document.querySelector("#slideFrame .emphasis-trigger").click()');assert.equal(await b.evaluate('state(current).revealed'),true);
  await b.evaluate('document.querySelector("#slideFrame .emphasis-copy").click()');assert.equal(await b.evaluate('currentSlide().id'),1400);
  await show(58);await b.evaluate('finishSlideTransition()');
  const point=await b.evaluate('(()=>{const r=document.querySelector("#slideFrame .slide-head").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:180,deltaX:0});await sleep(120);
  assert.equal(await b.evaluate('state(current).revealed'),true);assert.equal(await b.evaluate('currentSlide().id'),1401);
  await sleep(1000);await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaY:180,deltaX:0});await sleep(120);assert.equal(await b.evaluate('currentSlide().id'),15);
  pass('Plus, slide click and mouse wheel retain the reveal-then-advance sequence');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await b.evaluate('readingOverride=null;resizeStage()');
  for(const page of [55,56,57,58,61]){await show(page);await b.evaluate('resizeStage()');assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await b.screenshot('.qa/polished-mobile-'+page+'.png');}
  await b.evaluate('revealMessage();finishSlideTransition();resizeStage()');panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits,JSON.stringify(panel));
  await b.screenshot('.qa/polished-mobile-key.png');
  pass('Mobile layouts and full-slide statement fit without horizontal overflow');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await b.evaluate('togglePresent(false);resizeStage()');
  for(const page of [55,56,57,58,61]){await show(page);const bounds=await fit();assert.equal(bounds.overflow,false,'Editor page '+page+' '+JSON.stringify(bounds));}
  await show(55);
  await b.evaluate(`(()=>{const el=document.querySelector('[data-path$=".example.appTitle"]');el.focus();el.textContent='Edited attendance heading';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  assert.equal(await b.evaluate('data.slides.find(s=>s.id===1300).example.appTitle'),'Edited attendance heading');
  assert.equal(await b.evaluate('JSON.parse(localStorage.getItem(storageKey)).slides.find(s=>s.id===1300).example.appTitle'),'Edited attendance heading');
  await show(58);
  await b.evaluate(`(()=>{const el=document.querySelector('[data-path$=".lesson.prompt"]');el.focus();el.textContent='Custom teaching prompt';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}));el.blur();saveNow()})()`);
  assert.equal(await b.evaluate('JSON.parse(localStorage.getItem(storageKey)).slides.find(s=>s.id===1401).lesson.prompt'),'Custom teaching prompt');
  await b.evaluate('data=copy(DEFAULT);states={};renderAll();saveNow();buildPrint()');
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),63);
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-takeaway").length'),10);
  assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .emphasis").length'),0);
  await b.cdp('Emulation.setEmulatedMedia',{media:'print'});
  for(const page of [55,56,57,58,61]){
   const bounds=await b.evaluate(`(()=>{const s=document.querySelectorAll('#printRoot .print-page')[data.slides.findIndex(s=>s.id===${legacyIds[page-1]})].querySelector('.slide'),c=s.querySelector('.content-inner'),a=s.querySelector('.slide-content');return{height:c.scrollHeight,available:a.clientHeight,footerDirect:s.querySelector('.slide-foot').parentElement===s}})()`);
   assert.ok(bounds.height<=bounds.available+1&&bounds.footerDirect,'Print page '+page+' '+JSON.stringify(bounds));
  }
  await b.cdp('Emulation.setEmulatedMedia',{media:''});
  const pdf=await b.cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,pageRanges:'57-60,63',transferMode:'ReturnAsStream'});
  const parts=[];for(;;){const chunk=await b.cdp('IO.read',{handle:pdf.stream,size:65536});parts.push(Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8'));if(chunk.eof)break;}await b.cdp('IO.close',{handle:pdf.stream});fs.writeFileSync('.qa/polished-uiux.pdf',Buffer.concat(parts));
  pass('New example text edits and autosaves; 63-page print layout includes each idea once; sample PDF generated');
  await b.evaluate('window.__qaDownload=null;window.__qaOriginalDownload=download;download=(html,type,name)=>window.__qaDownload={html,type,name};exportHTML();download=window.__qaOriginalDownload');
  const meta=await b.evaluate('({name:window.__qaDownload.name,length:window.__qaDownload.html.length})');assert.equal(meta.name,'index.html');
  const exportParts=[];for(let start=0;start<meta.length;start+=100000)exportParts.push(await b.evaluate(`window.__qaDownload.html.slice(${start},${start+100000})`));
  fs.writeFileSync('.qa/polished-export.html',exportParts.join(''));
  await b.navigate(b.url+'/.qa/polished-export.html','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.version'),10);assert.equal(await b.evaluate('data.slides.find(s=>s.id===16).items.length'),6);
  await b.evaluate('go(data.slides.findIndex(s=>s.id===1401));togglePresent(true);finishSlideTransition()');
  assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame .lesson-app").length'),2);
  await b.evaluate('go(data.slides.findIndex(s=>s.id===1301));togglePresent(true);revealMessage();finishSlideTransition()');panel=await overlay();assert.ok(panel.full&&panel.center&&panel.fits);
  pass('Exported standalone HTML retains the new content, migration and presentation effects');
  assert.deepEqual(b.errors,[]);pass('No browser runtime errors');
  fs.writeFileSync('.qa/presentation-polish-results.json',JSON.stringify({checks,errors:b.errors},null,2));
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
