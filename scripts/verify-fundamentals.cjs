const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {startBrowser}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8160,debugPort:9260,width:1600,height:1000});
 const show=id=>b.evaluate(`go(data.slides.findIndex(s=>s.id===${id}));finishSlideTransition()`);
 const reset=()=>b.evaluate('data=copy(DEFAULT);current=0;states={};saveNow();renderAll();finishSlideTransition()');
 const click=selector=>b.evaluate(`document.querySelector(${JSON.stringify(selector)}).click();finishSlideTransition()`);
 const key=async(key,code)=>{await b.cdp('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code});await b.cdp('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});};
 const fit=()=>b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),h=s.querySelector('.slide-content'),c=s.querySelector('.content-inner');return {id:currentSlide().id,height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
 const checkFit=async()=>{const r=await fit();assert.ok(r.height<=r.available+1&&r.width<=r.availableWidth+1,JSON.stringify(r));};
 const newIds=[150,151,152,153,154,155,156];
 try{
  await b.navigate(b.url+'/?fundamentals-qa','typeof data!=="undefined"&&!!document.querySelector("#slideFrame>.slide")');await reset();
  assert.deepEqual(await b.evaluate('data.slides.slice(5,13).map(s=>s.id)'),[...newIds,200]);
  assert.deepEqual(await b.evaluate('[LEGACY_DEFAULT,V2_DEFAULT,V3_DEFAULT,V4_DEFAULT,V5_DEFAULT,V6_DEFAULT,V7_DEFAULT,V8_DEFAULT,V9_DEFAULT,V10_DEFAULT,V11_DEFAULT,V12_DEFAULT,DEFAULT].map(d=>{const v=validData(copy(d));return [v.version,v.slides.length,v.trash.length]})'),Array.from({length:13},()=>[13,73,0]));
  assert.equal(await b.evaluate(`(()=>{const d=copy(V12_DEFAULT);d.slides.find(s=>s.id===200).title='수정한 프론트엔드';d.slides.find(s=>s.id===203).items[0].description='수정한 API';d.layouts={'200':{'text:title:0':{x:8,y:9,width:800}}};const v=validData(d);return v.slides.find(s=>s.id===200).title==='수정한 프론트엔드'&&v.slides.find(s=>s.id===203).items[0].description==='수정한 API'&&JSON.stringify(v.layouts)===JSON.stringify(d.layouts)&&JSON.stringify(validData(v))===JSON.stringify(v)})()`),true);
  await b.evaluate('localStorage.setItem(storageKey,JSON.stringify(V12_DEFAULT))');await b.navigate(b.url+'/?fundamentals-migration','typeof data!=="undefined"');
  assert.equal(await b.evaluate('data.version===13&&data.slides.length===73&&!initialMessage'),true);
  console.log('PASS all 13 formats; prior edits and layouts; automatic migration on reload');

  await b.evaluate('togglePresent(true)');
  for(const theme of ['light','dark']){
   await b.evaluate(`data.theme='${theme}';renderAll()`);
   for(const id of newIds){await show(id);await checkFit();await b.screenshot('.qa/fund-'+theme+'-'+id+'.png');}
  }
  await show(153);await b.evaluate(`document.querySelector('[data-control=activity-demo]').value='';document.querySelector('[data-control=activity-demo]').dispatchEvent(new Event('input',{bubbles:true}))`);await click('[data-action=activity-save]');
  assert.match(await b.evaluate('document.querySelector(".fund-status").textContent'),/입력해/);
  await b.evaluate(`document.querySelector('[data-control=activity-demo]').value='학생 활동';document.querySelector('[data-control=activity-demo]').dispatchEvent(new Event('input',{bubbles:true}))`);await click('[data-action=activity-save]');
  assert.match(await b.evaluate('document.querySelector(".fund-status").textContent'),/저장 완료/);assert.equal(await b.evaluate('currentSlide().id'),153);
  await show(156);for(let n=0;n<4;n++){await click('[data-action=select][data-value="'+n+'"]');assert.equal(await b.evaluate('state(current).selected'),n);await checkFit();}
  console.log('PASS light/dark layouts; JavaScript input and feedback; four data-flow steps');

  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await b.evaluate('readingOverride=null;resizeStage()');
  for(const id of newIds){await show(id);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);assert.equal(await b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),c=s.querySelector('.content-inner');return c.scrollWidth<=s.clientWidth})()`),true);}
  await b.screenshot('.qa/fund-mobile-flow.png');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});await b.evaluate('data.theme="light";togglePresent(false);resizeStage()');
  await reset();
  const originalOrder=await b.evaluate('data.slides.map(s=>s.id)');
  const navPoint=await b.evaluate(`(()=>{const r=document.querySelector('[data-slide-nav="1"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await b.cdp('Input.dispatchMouseEvent',{type:'mousePressed',...navPoint,button:'left',clickCount:1});
  await b.cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...navPoint,button:'left',clickCount:1});
  assert.equal(await b.evaluate('current'),1);
  assert.equal(await b.evaluate('document.activeElement.dataset.slideNav'),'1');
  await key('ArrowDown',40);assert.equal(await b.evaluate('current'),2);
  await key('ArrowUp',38);assert.equal(await b.evaluate('current'),1);
  for(let n=0;n<30;n++)await key('ArrowDown',40);
  assert.equal(await b.evaluate('current'),31);assert.equal(await b.evaluate('document.activeElement.dataset.slideNav'),'31');
  assert.equal(await b.evaluate(`(()=>{const item=document.activeElement.getBoundingClientRect(),manager=document.querySelector('.slide-manager').getBoundingClientRect(),sidebar=document.querySelector('.sidebar').getBoundingClientRect();return item.top>=manager.bottom&&item.bottom<=sidebar.bottom})()`),true);
  for(let n=0;n<31;n++)await key('ArrowUp',38);
  const startScroll=await b.evaluate('document.querySelector(".sidebar").scrollTop');await key('ArrowUp',38);
  assert.equal(await b.evaluate('current'),0);assert.equal(await b.evaluate('document.querySelector(".sidebar").scrollTop'),startScroll);
  await click('[data-slide-nav="72"]');await key('ArrowDown',40);assert.equal(await b.evaluate('current'),72);
  assert.equal(await b.evaluate('document.activeElement.dataset.slideNav'),'72');assert.deepEqual(await b.evaluate('data.slides.map(s=>s.id)'),originalOrder);
  await b.evaluate(`const field=document.querySelector('#slideFrame [contenteditable]');field.focus();const selection=getSelection(),range=document.createRange();range.selectNodeContents(field);range.collapse(false);selection.removeAllRanges();selection.addRange(range);`);
  await key('ArrowUp',38);assert.equal(await b.evaluate('current'),72);
  console.log('PASS list click retains focus; up/down selects adjacent slides, keeps selection visible, respects boundaries and leaves slide order/text editing unchanged');
  await reset();await show(150);
  const points=await b.evaluate(`(()=>{document.querySelector('.sidebar').scrollTop=250;const a=document.querySelector('[data-slide-id="151"] .nav-handle').getBoundingClientRect(),c=document.querySelector('[data-slide-id="153"]').getBoundingClientRect();return {from:{x:a.x+a.width/2,y:a.y+a.height/2},to:{x:c.x+c.width/2,y:c.bottom-5}}})()`);
  await b.cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...points.from});await b.cdp('Input.dispatchMouseEvent',{type:'mousePressed',...points.from,button:'left',clickCount:1});
  await b.cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...points.to,button:'left',buttons:1});await b.cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...points.to,button:'left',clickCount:1});
  assert.deepEqual(await b.evaluate('data.slides.slice(5,9).map(s=>s.id)'),[150,152,153,151]);assert.equal(await b.evaluate('currentSlide().id'),150);
  await b.evaluate(`document.querySelector('[data-slide-id="151"] .nav-handle').focus()`);await key('Home',36);
  assert.equal(await b.evaluate('data.slides[0].id'),151);await key('End',35);assert.equal(await b.evaluate('data.slides.at(-1).id'),151);
  await show(200);await click('#moveSlideUp');assert.equal(await b.evaluate('currentSlide().id'),200);
  const expectedOrder=await b.evaluate('data.slides.map(s=>s.id)');await b.navigate(b.url+'/?fundamentals-reorder','typeof data!=="undefined"');
  assert.deepEqual(await b.evaluate('data.slides.map(s=>s.id)'),expectedOrder);assert.equal(await b.evaluate('initialMessage'), '');
  console.log('PASS real pointer drag, keyboard first/last moves, selected-slide identity and saved order');

  await reset();await show(152);
  await b.evaluate(`editValue(pathFor(current,'title'),'수정한 CSS');editValue(pathFor(current,'notes'),'복구할 강사 메모');data.layouts['152']={'text:title:0':{x:7,y:8,width:880}};saveNow()`);
  await click('#deleteSlide');assert.equal(await b.evaluate('data.slides.length'),72);assert.equal(await b.evaluate('data.trash[0].slide.title'),'수정한 CSS');assert.equal(await b.evaluate('currentSlide().id'),153);
  await b.navigate(b.url+'/?fundamentals-trash','typeof data!=="undefined"');assert.equal(await b.evaluate('initialMessage'), '');
  assert.equal(await b.evaluate('data.slides.some(s=>s.id===152)'),false);assert.equal(await b.evaluate('data.trash[0].slide.notes'),'복구할 강사 메모');
  await b.evaluate('document.querySelector("#slideTrash").open=true');await click('[data-restore-slide="152"]');
  assert.equal(await b.evaluate('currentSlide().id'),152);assert.equal(await b.evaluate('current'),7);assert.equal(await b.evaluate('document.querySelector("#slideFrame h1").style.translate'),'7px 8px');assert.equal(await b.evaluate('data.trash.length'),0);
  await b.evaluate('deleteSlide(151);deleteSlide(152);deleteSlide(153);restoreSlide(152);restoreSlide(151);restoreSlide(153)');
  assert.deepEqual(await b.evaluate('data.slides.slice(5,12).map(s=>s.id)'),newIds);
  await b.evaluate('deleteSlide(700)');await show(7100);assert.match(await b.evaluate('document.querySelector("#slideFrame .db-profile-title").textContent'),/Google Sheets/);
  await b.evaluate(`editValue('trash.'+data.trash.findIndex(e=>e.slide.id===700)+'.slide.title','수정한 Sheets');restoreSlide(700)`);assert.equal(await b.evaluate('currentSlide().title'),'수정한 Sheets');
  const firstPart=await b.evaluate('data.slides.find(s=>s.type==="section"&&s.part===0).id');await b.evaluate(`deleteSlide(${firstPart});jumpToChapter(0)`);assert.equal(await b.evaluate('currentSlide().part'),0);
  console.log('PASS delete/reload/restore with edits, notes, placement and adjacent deletions; linked DB intro and chapter navigation');

  await b.evaluate('window._originalDownload=download;download=(content,type,name)=>{window._export={content,type,name}};exportJSON()');
  const json=await b.evaluate('_export.content');fs.writeFileSync('.qa/fundamentals-export.json',json);
  assert.equal(await b.evaluate('JSON.stringify(validData(JSON.parse(_export.content)))===JSON.stringify(data)'),true);
  const before=await b.evaluate('({ids:data.slides.map(s=>s.id),trash:data.trash.map(e=>e.slide.id),title:data.slides.find(s=>s.id===152).title,layouts:data.layouts})');
  // Exercise the actual import input, including the existing confirmation dialog.
  await reset();await b.evaluate('window.confirm=()=>true');const doc=await b.cdp('DOM.getDocument'),input=await b.cdp('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#importInput'});
  await b.cdp('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[path.resolve('.qa/fundamentals-export.json')]});await b.until('data.trash.length===1');
  assert.deepEqual(await b.evaluate('({ids:data.slides.map(s=>s.id),trash:data.trash.map(e=>e.slide.id),title:data.slides.find(s=>s.id===152).title,layouts:data.layouts})'),before);
  await b.evaluate('exportHTML()');const exportLength=await b.evaluate('_export.content.length'),chunks=[];
  for(let start=0;start<exportLength;start+=100000)chunks.push(await b.evaluate(`_export.content.slice(${start},${start+100000})`));
  fs.writeFileSync('.qa/fundamentals-export.html',chunks.join(''));
  await b.cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await b.navigate(pathToFileURL(path.resolve('.qa/fundamentals-export.html')).href,'typeof data!=="undefined"');
  assert.equal(await b.evaluate('initialMessage'), '');assert.deepEqual(await b.evaluate('({ids:data.slides.map(s=>s.id),trash:data.trash.map(e=>e.slide.id),title:data.slides.find(s=>s.id===152).title,layouts:data.layouts})'),before);
  await b.evaluate('restoreSlide(data.trash[0].slide.id)');assert.equal(await b.evaluate('data.slides.length'),73);
  console.log('PASS actual JSON import and standalone offline HTML retain order, trash and edited layouts');

  await reset();await b.evaluate('togglePresent(true)');
  for(const id of await b.evaluate('data.slides.map(s=>s.id)')){await show(id);assert.equal(await b.evaluate('document.querySelectorAll("#slideFrame h1").length'),1,'Title for '+id);}
  await b.evaluate('document.fonts.ready');await b.evaluate('buildPrint()');assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),73);
  await b.cdp('Emulation.setEmulatedMedia',{media:'print'});
  const printBounds=await b.evaluate(`Array.from(document.querySelectorAll('#printRoot .slide')).filter(s=>[150,151,152,153,154,155,156].includes(data.slides[Number(s.dataset.slide)].id)).map(s=>{s.closest('#printRoot').style.display='block';const h=s.querySelector('.slide-content'),c=s.querySelector('.content-inner');return {id:data.slides[Number(s.dataset.slide)].id,height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})`);
  for(const r of printBounds)assert.ok(r.height<=r.available+1&&r.width<=r.availableWidth+1,JSON.stringify(r));
  await b.cdp('Emulation.setEmulatedMedia',{media:''});
  await b.evaluate('document.querySelector("#printRoot").style.display=""');
  const pdf=await b.cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,pageRanges:'6-12',transferMode:'ReturnAsStream'}),pdfChunks=[];
  for(;;){const chunk=await b.cdp('IO.read',{handle:pdf.stream,size:65536});pdfChunks.push(Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8'));if(chunk.eof)break;}await b.cdp('IO.close',{handle:pdf.stream});fs.writeFileSync('.qa/fundamentals-slides.pdf',Buffer.concat(pdfChunks));
  await b.evaluate('togglePresent(false);for(const id of data.slides.map(s=>s.id))if(id!==7100)deleteSlide(id);deleteSlide(7100)');
  assert.equal(await b.evaluate('data.slides.length'),1);assert.equal(await b.evaluate('data.trash.length'),72);assert.equal(await b.evaluate('document.querySelector("#deleteSlide").disabled'),true);
  assert.equal(await b.evaluate('validData(copy(data)).trash.length'),72);await b.evaluate('buildPrint()');assert.equal(await b.evaluate('document.querySelectorAll("#printRoot .print-page").length'),1);
  await reset();
  const invalid=await b.evaluate(`(()=>{const cases=[d=>d.slides[1].id=d.slides[0].id,d=>d.slides[0].type='webLanguage',d=>d.slides=[],d=>d.layouts={'999':{}},d=>d.trash.push({slide:d.slides[0],index:0,beforeId:null,afterId:null})];return cases.map(change=>{const d=copy(DEFAULT);change(d);try{validData(d);return false}catch{return true}})})()`);assert.ok(invalid.every(Boolean));
  assert.deepEqual(b.errors,[]);console.log('PASS all 73 slides render; PDF contains new lessons; last-slide guard; invalid imports rejected; no browser errors');
 }finally{await b.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
