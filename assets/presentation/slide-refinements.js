const IDEA_MAX_CHARS=180,IDEA_MAX_LINES=6,IDEA_LAYOUT_KEY='block:key-idea:0';
function ideaFontSize(i=current){return Math.max(28,Math.min(80,data.layouts[String(data.slides[i].id)]?.[IDEA_LAYOUT_KEY]?.fontSize||60));}
function ideaValidation(text){
 if(text.length>IDEA_MAX_CHARS)return '핵심 문구는 공백과 줄바꿈을 포함해 180자까지 입력할 수 있습니다.';
 if(text.split('\n').length>IDEA_MAX_LINES)return '줄바꿈은 최대 6줄까지 사용할 수 있습니다.';
 return '';
}
function fitIdeaText(quote,size){
 quote.style.setProperty('--idea-font-size',size+'px');
 const parent=quote.parentElement,height=540;
 while(size>12&&(quote.scrollHeight>height||quote.scrollWidth>parent.clientWidth)){size--;quote.style.setProperty('--idea-font-size',size+'px');}
 return size;
}
function fitPresentedIdea(slide){
 const box=slide?.querySelector(':scope>.emphasis.is-shown');if(!box)return;
 const i=Number(slide.dataset.slide);box.style.setProperty('--idea-mobile-scale',slide.clientWidth/1280);
 fitIdeaText(box.querySelector('.quote'),ideaFontSize(i));
}
function comparisonBrand(n){return '<span class="comparison-brand"><img src="'+AI_BRAND_LOGOS[['openai','gemini','claude'][n]]+'" width="30" height="30" alt="'+['OpenAI','Gemini','Claude'][n]+' 로고"></span>';}
function comparisonQuote(i,n,printing){
 const path='rows.0.'+(n+1),raw=currentAt(i).rows[0][n+1],text=raw.replace(/^[“"]([\s\S]*)[”"]$/,'$1');
 return '<p class="comparison-value" data-path="'+pathFor(i,path)+'"'+(!printing&&!presenting?' contenteditable="plaintext-only" spellcheck="false"':'')+'>'+escapeHTML(text)+'</p>';
}
function costSymbol(n,database=false){
 const paths=database?[
  'M3 3h8l10 10-8 8L3 11V3ZM7 7h.01M9 12l3 3 5-5',
  'M4 3h9v4H4zM4 10h13v4H4zM4 17h17v4H4z',
  'M4.2 18a9 9 0 1 1 15.6 0H4.2ZM12 14l4-5M12 5v2M5 10l2 1M19 10l-2 1'
 ]:['M12 3v18M4 21h16M4 7h16M6 7l-4 8h8L6 7Zm12 0-4 8h8l-4-8Z','M4 4h16v5H4zM4 12h7v8H4zM14 12h6v8h-6zM7 6.5h10','m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z'];
 return '<span class="'+(database?'pictogram ':'')+'ledger-symbol" aria-hidden="true"><svg'+(database?' class="icon"':'')+' viewBox="0 0 24 24"><path d="'+paths[n]+'"/></svg></span>';
}
function updateStageNavigation(){
 const host=document.querySelector('.stage-wrap'),frame=document.getElementById('slideFrame'),prev=document.getElementById('stagePrev'),next=document.getElementById('stageNext');
 if(!host||!frame||document.body.classList.contains('reading'))return;
 const h=host.getBoundingClientRect(),f=frame.getBoundingClientRect();if(!h.width||!f.width)return;
 const gap=parseFloat(getComputedStyle(host).getPropertyValue('--stage-arrow-gap'))||6;
 host.style.setProperty('--stage-prev-x',Math.max(0,f.left-h.left-prev.offsetWidth-gap)+'px');
 host.style.setProperty('--stage-next-x',Math.min(h.width-next.offsetWidth,f.right-h.left+gap)+'px');
 host.style.setProperty('--stage-arrow-y',(f.top-h.top+f.height/2)+'px');
}
function setupIdeaEditor(){
 const dialog=document.createElement('dialog');dialog.id='ideaEditor';dialog.className='idea-dialog';dialog.setAttribute('aria-labelledby','ideaEditorTitle');
 dialog.innerHTML='<div class="idea-dialog-head"><div><h2 id="ideaEditorTitle">핵심 문구 · 줄바꿈과 글자 크기</h2><p>Enter로 줄을 나누세요. 미리보기의 배치가 발표 화면에 그대로 적용됩니다.</p></div><button type="button" data-idea-cancel aria-label="핵심 문구 편집 닫기">닫기</button></div><div class="idea-editor-grid"><div class="idea-editor-fields"><label for="ideaText">전체화면에 보여 줄 문구</label><textarea id="ideaText" maxlength="180" rows="6" aria-describedby="ideaCount ideaError" spellcheck="false"></textarea><output class="idea-editor-count" id="ideaCount" for="ideaText"></output><label for="ideaFontSize">글자 크기</label><div class="idea-size-controls"><button type="button" id="ideaSmaller" aria-label="핵심 문구 글자 크기 줄이기">−</button><input id="ideaFontSize" type="number" min="28" max="80" step="2" value="60"><span>px</span><button type="button" id="ideaLarger" aria-label="핵심 문구 글자 크기 키우기">+</button><button type="button" id="ideaDefaultSize">기본값</button></div><p>28~80px · 길이에 따라 화면 안에 맞춥니다.</p><p id="ideaError" class="idea-editor-error" role="status"></p></div><div><span class="idea-preview-label">발표 화면 미리보기 · 16:9</span><div class="idea-preview-viewport"><div class="idea-canvas"><div class="idea-preview-copy"></div></div></div><p class="idea-preview-help" id="ideaPreviewHelp"></p></div></div><div class="idea-dialog-foot"><button type="button" data-idea-cancel>취소</button><button type="button" id="ideaApply" class="primary">적용</button></div>';
 document.body.append(dialog);
 const input=dialog.querySelector('#ideaText'),font=dialog.querySelector('#ideaFontSize'),apply=dialog.querySelector('#ideaApply'),error=dialog.querySelector('#ideaError'),viewport=dialog.querySelector('.idea-preview-viewport'),canvas=dialog.querySelector('.idea-canvas');
 let slideId=null,returnFocus=null;
 function update(){
  const i=data.slides.findIndex(s=>s.id===slideId);if(i<0)return;
  const message=ideaValidation(input.value),size=Number(font.value),validSize=Number.isFinite(size)&&size>=28&&size<=80;
  error.textContent=message||(!validSize?'글자 크기는 28~80px 사이로 설정해 주세요.':'');
  input.setAttribute('aria-invalid',String(!!message));font.setAttribute('aria-invalid',String(!validSize));apply.disabled=!!message||!validSize;
  dialog.querySelector('#ideaCount').textContent=input.value.length+' / 180자 · '+input.value.split('\n').length+' / 6줄';
  canvas.querySelector('.idea-preview-copy').innerHTML=keyIdeaMarkup(i,'takeaway',input.value);
  const actual=fitIdeaText(canvas.querySelector('.quote'),validSize?size:60);
  dialog.querySelector('#ideaPreviewHelp').textContent=actual<size?'입력한 줄바꿈을 유지하며 '+actual+'px로 자동 조정됩니다.':'입력한 줄바꿈과 글자 크기로 표시합니다. 긴 줄은 미리보기와 같은 위치에서 줄바꿈됩니다.';
  canvas.style.transform='scale('+viewport.clientWidth/1280+')';
  dialog.querySelector('#ideaSmaller').disabled=validSize&&size<=28;dialog.querySelector('#ideaLarger').disabled=validSize&&size>=80;
 }
 window.openIdeaEditor=()=>{
  if(presenting||!hasKeyIdea(current))return;
  clearLayoutSelection();slideId=currentSlide().id;returnFocus=document.activeElement;input.value=currentSlide().takeaway;font.value=ideaFontSize();dialog.showModal();update();input.focus();
 };
 input.addEventListener('input',event=>{if(!event.isComposing)update();});input.addEventListener('compositionend',update);font.addEventListener('input',update);
 dialog.querySelector('#ideaSmaller').onclick=()=>{font.value=Math.max(28,(Number(font.value)||60)-2);update();};
 dialog.querySelector('#ideaLarger').onclick=()=>{font.value=Math.min(80,(Number(font.value)||60)+2);update();};
 dialog.querySelector('#ideaDefaultSize').onclick=()=>{font.value=60;update();};
 dialog.querySelectorAll('[data-idea-cancel]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});else $('#slideFrame [data-action="edit-idea"]')?.focus({preventScroll:true});});
 apply.onclick=()=>{
  update();if(apply.disabled)return;
  const slide=data.slides.find(s=>s.id===slideId);if(!slide)return;
  slide.takeaway=input.value;data.layouts[String(slideId)]??={};data.layouts[String(slideId)][IDEA_LAYOUT_KEY]={fontSize:Number(font.value)};
  scheduleSave();saveNow();dialog.close();renderCurrent();$('#slideFrame [data-action="edit-idea"]')?.focus({preventScroll:true});
 };
 new ResizeObserver(()=>{if(dialog.open)update();}).observe(viewport);
 document.fonts.ready.then(()=>{if(dialog.open)update();fitPresentedIdea($('#slideFrame>.slide'));});
}
