const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {startBrowser}=require('./browser-qa.cjs');
process.chdir(path.resolve(__dirname,'..'));fs.mkdirSync('.qa',{recursive:true});
(async()=>{
 const b=await startBrowser({port:8152,debugPort:9252,width:1600,height:1000});
 const show=id=>b.evaluate(`go(data.slides.findIndex(s=>s.id===${id}));finishSlideTransition()`);
 const input=async(selector,value)=>b.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 // Compare actual browser line breaking, including spaces and inline highlight spans.
 const signature=selector=>`(()=>{const q=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(q),walker=document.createTreeWalker(q,NodeFilter.SHOW_TEXT),lines=[];let node,previous;while(node=walker.nextNode()){for(let n=0;n<node.length;n++){const r=document.createRange();r.setStart(node,n);r.setEnd(node,n+1);const top=r.getBoundingClientRect().top;if(previous===undefined||Math.abs(top-previous)>1)lines.push('');lines[lines.length-1]+=node.data[n];previous=top;}}return {lines,font:s.fontSize,width:q.clientWidth,height:q.clientHeight}})()`;
 try{
  await b.navigate(b.url+'/?refinement-qa','typeof data!=="undefined"');
  await b.evaluate('localStorage.clear();data=copy(DEFAULT);states={};current=0;renderAll()');
  await b.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await show(303);
  await b.evaluate('document.querySelector("[data-action=edit-idea]").click()');
  assert.equal(await b.evaluate('document.querySelector("#ideaEditor").open'),true);
  const text='바이브 코딩에서 기초 용어를 알고 요청하는 것은\nAI와의 대화 수를 줄일 수 있다는 데\n  의의가 있습니다.';
  await input('#ideaText',text);await input('#ideaFontSize','48');
  await b.screenshot('.qa/key-idea-editor.png');
  const preview=await b.evaluate(signature('#ideaEditor .quote'));
  assert.equal(await b.evaluate('document.querySelector("#ideaApply").disabled'),false);
  await b.evaluate('document.querySelector("#ideaApply").click();togglePresent(true);revealMessage();finishSlideTransition()');
  assert.deepEqual(await b.evaluate(signature('#slideFrame .emphasis .quote')),preview);
  assert.equal(await b.evaluate('document.querySelector("#slideFrame .quote").textContent'),text);
  await b.screenshot('.qa/key-idea-present.png');
  const saved=await b.evaluate('JSON.parse(localStorage.getItem(storageKey))');
  assert.equal(saved.slides.find(s=>s.id===303).takeaway,text);assert.equal(saved.layouts['303']['block:key-idea:0'].fontSize,48);
  await b.navigate(b.url+'/?refinement-reload','typeof data!=="undefined"');await show(303);
  assert.equal(await b.evaluate('currentSlide().takeaway'),text);assert.equal(await b.evaluate('ideaFontSize()'),48);
  console.log('PASS manual line breaks, spaces and font size match actual preview/presentation geometry and survive reload');
  await b.evaluate('openIdeaEditor()');
  await input('#ideaText','가'.repeat(181));assert.equal(await b.evaluate('document.querySelector("#ideaApply").disabled'),true);
  await input('#ideaText',Array(7).fill('한 줄').join('\n'));assert.equal(await b.evaluate('document.querySelector("#ideaApply").disabled'),true);
  await input('#ideaText',Array(6).fill('긴 문구를 화면에 맞추어 보여 줍니다.').join('\n'));await input('#ideaFontSize','80');
  assert.equal(await b.evaluate('document.querySelector("#ideaApply").disabled'),false);
  const fitted=await b.evaluate(signature('#ideaEditor .quote'));assert.ok(parseFloat(fitted.font)<80&&fitted.height<=540);
  await b.evaluate('document.querySelector("#ideaApply").click();togglePresent(true);revealMessage();finishSlideTransition()');
  assert.deepEqual(await b.evaluate(signature('#slideFrame .quote')),fitted);
  await b.evaluate('togglePresent(false);openIdeaEditor()');await input('#ideaText','취소할 수정');await input('#ideaFontSize','30');
  await b.evaluate('document.querySelector("#ideaEditor [data-idea-cancel]").click()');
  assert.equal(await b.evaluate('ideaFontSize()'),80);assert.notEqual(await b.evaluate('currentSlide().takeaway'),'취소할 수정');
  await b.evaluate(`(()=>{const e=document.querySelector('#slideFrame .edit-takeaway');e.focus();e.textContent='가'.repeat(181);e.dispatchEvent(new InputEvent('input',{bubbles:true}));})()`);
  assert.equal(await b.evaluate('document.querySelector("#slideFrame .edit-takeaway").textContent===currentSlide().takeaway'),true);
  await b.evaluate(`(()=>{const e=document.querySelector('#slideFrame .edit-takeaway');e.textContent='한글 입력 중';e.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));})()`);
  assert.notEqual(await b.evaluate('currentSlide().takeaway'),'한글 입력 중');
  await b.evaluate('document.querySelector("#slideFrame .edit-takeaway").dispatchEvent(new CompositionEvent("compositionend",{bubbles:true}))');
  assert.equal(await b.evaluate('currentSlide().takeaway'),'한글 입력 중');
  console.log('PASS character/line limits, automatic fit, cancellation and Korean IME input');
  await b.evaluate('openIdeaEditor()');await input('#ideaText',text);await input('#ideaFontSize','48');await b.evaluate('document.querySelector("#ideaApply").click()');
  await b.evaluate('moveSlide(currentSlide().id,current+1);saveNow()');assert.equal(await b.evaluate('ideaFontSize()'),48);
  await b.evaluate('deleteSlide();restoreSlide(303);saveNow()');await show(303);assert.equal(await b.evaluate('ideaFontSize()'),48);
  await b.evaluate('data=validData(JSON.parse(JSON.stringify(data)));renderAll()');assert.equal(await b.evaluate('currentSlide().takeaway'),text);
  console.log('PASS JSON round trip, slide reordering and trash recovery preserve message formatting by slide ID');
  await b.evaluate('data=copy(DEFAULT);states={};clearTimeout(toastTimer);document.querySelector("#toast").classList.remove("visible");togglePresent(true)');
  for(let n=21;n<31;n++){
   await b.evaluate(`go(${n});finishSlideTransition()`);
   const fit=await b.evaluate(`(()=>{const s=document.querySelector('#slideFrame>.slide'),c=s.querySelector('.content-inner'),h=s.querySelector('.slide-content');return {page:current+1,height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth,overflow:s.classList.contains('content-overflow')}})()`);
   assert.ok(fit.height<=fit.available+1&&fit.width<=fit.availableWidth+1&&!fit.overflow,JSON.stringify(fit));assert.ok(fit.available-fit.height<20,JSON.stringify(fit));
   if(n>=24&&n<=28){const logos=await b.evaluate('[...document.querySelectorAll("#slideFrame .comparison-brand img")].map(e=>({src:e.src,loaded:e.complete&&e.naturalWidth>0}))');assert.equal(logos.length,3);assert.equal(new Set(logos.map(e=>e.src)).size,3);assert.ok(logos.every(e=>e.loaded));}
   await b.screenshot('.qa/refined-slide-'+(n+1)+'.png');
  }
  await show(500);
  assert.equal(await b.evaluate(`(()=>{const cards=[...document.querySelectorAll('#slideFrame .quote-case')];return cards.every(c=>c.querySelector('.quote-sign').textContent==='“'&&c.querySelector('.quote-close').textContent==='”'&&getComputedStyle(c.querySelector('.comparison-value')).textAlign==='center'&&!/[“”]/.test(c.querySelector('.comparison-value').textContent))})()`),true);
  await show(502);assert.equal(await b.evaluate('new Set([...document.querySelectorAll("#slideFrame .ledger-symbol path")].map(e=>e.getAttribute("d"))).size'),3);
  console.log('PASS slides 22–31 fill the content area without clipping; paired centered quotes and three distinct brand/cost icons');
  await b.evaluate('toggleTheme()');for(const id of [500,502,601]){await show(id);await b.screenshot('.qa/refined-dark-'+id+'.png');}await b.evaluate('toggleTheme()');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await b.evaluate('readingOverride=null;resizeStage()');
  for(const id of [400,401,402,500,501,502,503,504,600,601]){await show(id);await b.evaluate('resizeStage()');assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Mobile '+id);}
  await show(303);await b.evaluate('togglePresent(false);openIdeaEditor()');await input('#ideaText',text);await input('#ideaFontSize','48');
  assert.equal(await b.evaluate('document.querySelector("#ideaEditor").scrollWidth<=document.querySelector("#ideaEditor").clientWidth'),true);
  await b.screenshot('.qa/key-idea-editor-mobile.png');
  const mobilePreview=await b.evaluate(signature('#ideaEditor .quote'));
  await b.evaluate('document.querySelector("#ideaApply").click();togglePresent(true);revealMessage();finishSlideTransition();resizeStage()');
  assert.deepEqual(await b.evaluate(signature('#slideFrame .quote')),mobilePreview);await b.screenshot('.qa/key-idea-mobile.png');
  await b.cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});await b.evaluate('togglePresent(false);resizeStage();buildPrint()');
  await b.cdp('Emulation.setEmulatedMedia',{media:'print'});
  for(let n=21;n<31;n++){
   const fit=await b.evaluate(`(()=>{const s=document.querySelectorAll('#printRoot .slide')[${n}],c=s.querySelector('.content-inner'),h=s.querySelector('.slide-content');return {page:${n+1},height:c.scrollHeight,available:h.clientHeight,width:c.scrollWidth,availableWidth:h.clientWidth}})()`);
   assert.ok(fit.height<=fit.available+1&&fit.width<=fit.availableWidth+1,JSON.stringify(fit));
  }
  await b.cdp('Emulation.setEmulatedMedia',{media:''});
  console.log('PASS dark theme, 390px layouts, mobile preview/presentation consistency and PDF layout');
  await b.evaluate('window.__refinementExport=null;window.__originalDownload=download;download=html=>window.__refinementExport=html;exportHTML();download=window.__originalDownload');
  const length=await b.evaluate('window.__refinementExport.length'),chunks=[];for(let i=0;i<length;i+=100000)chunks.push(await b.evaluate(`window.__refinementExport.slice(${i},${i+100000})`));
  fs.writeFileSync('.qa/refinements-export.html',chunks.join(''));
  await b.navigate(b.url+'/.qa/refinements-export.html','typeof data!=="undefined"');await b.cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await show(303);assert.equal(await b.evaluate('currentSlide().takeaway'),text);assert.equal(await b.evaluate('ideaFontSize()'),48);
  await b.evaluate('openIdeaEditor()');assert.equal(await b.evaluate('document.querySelector("#ideaText").value'),text);await b.evaluate('document.querySelector("#ideaEditor").close()');
  await show(502);assert.equal(await b.evaluate('[...document.querySelectorAll("#slideFrame .comparison-brand img")].every(e=>e.complete&&e.naturalWidth>0)'),true);
  assert.deepEqual(b.errors,[]);console.log('PASS standalone HTML exports all editor behavior, saved formatting and logos offline; no runtime errors');
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
