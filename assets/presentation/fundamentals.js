/* Included in the main script so exported HTML remains self-contained. */
function renderVibeBenefits(i,printing){
 return '<div class="fund-benefits">'+currentAt(i).items.map((_,n)=>'<section class="fund-benefit">'+pictogram(['bulb','target','repeat'][n])+S(i,'items.'+n+'.title','h2','',printing)+S(i,'items.'+n+'.description','p','',printing)+S(i,'items.'+n+'.example','p','fund-example',printing)+'</section>').join('')+'</div>'+S(i,'note','p','fund-note',printing);
}
function renderWebLanguage(i,printing){
 const d=currentAt(i),raw=d.kind==='html',interactive=d.kind==='js'&&!printing,st=state(i);
 const preview='<div class="language-preview '+(raw?'is-html':'')+'"><h2>학생 활동</h2><input aria-label="활동 내용 체험" placeholder="활동 내용" value="'+escapeHTML(st.activity??'과학 동아리 발표')+'"'+(interactive?' data-control="activity-demo" maxlength="120"':' readonly')+'><button type="button"'+(interactive?' data-action="activity-save"':' tabindex="-1" aria-disabled="true"')+'>저장하기</button><p class="fund-status" role="status">'+(interactive?escapeHTML(st.activityStatus||''):d.kind==='js'?'클릭 → 입력 확인 → 저장 요청':'')+'</p></div>';
 return '<div class="web-language"><section class="language-copy">'+S(i,'role','span','editorial-label',printing)+S(i,'definition','h2','',printing)+S(i,'analogy','p','language-analogy',printing)+S(i,'example','p','language-example',printing)+S(i,'code','pre','language-code',printing)+'</section>'+demoBrowser(preview,S(i,'previewLabel','span','',printing))+'</div>'+S(i,'note','p','fund-note',printing);
}
function renderButtonAnatomy(i,printing){
 return '<div class="button-anatomy">'+currentAt(i).items.map((_,n)=>'<section class="anatomy-part">'+S(i,'items.'+n+'.title','span','editorial-label',printing)+S(i,'items.'+n+'.role','h2','',printing)+S(i,'items.'+n+'.description','p','',printing)+'<span class="anatomy-demo '+(n?'styled':'raw')+'">'+(n===2?icon('bolt'):'')+'저장하기</span></section>').join('')+'</div>'+S(i,'note','p','fund-note',printing);
}
function renderWebArchitecture(i,printing){
 const node=(key,symbol,extra='')=>'<section class="architecture-node">'+pictogram(symbol)+S(i,key,'h2','',printing)+S(i,key+'Description','p','',printing)+extra+'</section>';
 return '<div class="architecture-map">'+node('frontend','screen',S(i,'frontendExample','p','architecture-tech',printing))+'<div class="architecture-connection">'+S(i,'api','strong','',printing)+icon('arrow')+'<small>요청</small>'+icon('arrow').replace('class="icon"','class="icon response"')+'<small>응답</small>'+S(i,'apiDescription','small','',printing)+'</div><div class="architecture-server">'+S(i,'server','span','',printing)+node('backend','server')+S(i,'serverDescription','p','',printing)+'</div><div class="architecture-connection">'+icon('arrow')+icon('arrow').replace('class="icon"','class="icon response"')+'</div>'+node('database','database')+'</div>'+S(i,'note','p','fund-note',printing);
}
function renderWebDataFlow(i,printing){
 const d=currentAt(i),st=state(i),symbols=['edit','link','database','check'];
 return '<div class="flow-steps">'+d.steps.map((_,n)=>{const inner='<span class="flow-step-number">STEP 0'+(n+1)+'</span>'+pictogram(symbols[n])+S(i,'steps.'+n+'.title','strong','',printing)+S(i,'steps.'+n+'.label','span','flow-label',printing)+(printing?S(i,'steps.'+n+'.description','p','flow-print-description',true):'');return printing?'<section class="flow-step">'+inner+'</section>':button(inner,'select',n,n===st.selected,'flow-step');}).join('')+'</div>'+(printing?'':'<div class="flow-detail" aria-live="polite">'+pictogram(symbols[st.selected])+S(i,'steps.'+st.selected+'.description','p')+'</div>')+S(i,'note','p','fund-note',printing);
}

function deckChanged(selectedId){
 current=Math.max(0,data.slides.findIndex(s=>s.id===selectedId));states={};printReady=false;saveNow();renderAll();
 $('#slideAnnouncement').textContent=(current+1)+' / '+data.slides.length+' · '+slideTitle(currentSlide());
}
function moveSlide(id,index){
 const from=data.slides.findIndex(s=>s.id===id),selectedId=currentSlide().id;
 if(from<0||!Number.isInteger(index))return;
 const to=Math.max(0,Math.min(data.slides.length-1,index));if(from===to)return;
 const [slide]=data.slides.splice(from,1);data.slides.splice(to,0,slide);deckChanged(selectedId);
 notify('슬라이드를 '+(to+1)+'번으로 옮겼습니다.');
}
function deleteSlide(id=currentSlide().id){
 if(data.slides.length<=1){notify('강의에는 최소 한 장의 슬라이드가 필요합니다.');return;}
 const index=data.slides.findIndex(s=>s.id===id);if(index<0)return;
 const selectedId=currentSlide().id,slide=data.slides[index];
 data.trash.push({slide,index,beforeId:data.slides[index-1]?.id??null,afterId:data.slides[index+1]?.id??null});
 data.slides.splice(index,1);deckChanged(id===selectedId?data.slides[Math.min(index,data.slides.length-1)].id:selectedId);
 notify('슬라이드를 휴지통으로 옮겼습니다. 휴지통에서 복구할 수 있습니다.');
}
function restoreSlide(id){
 const n=data.trash.findIndex(entry=>entry.slide.id===id);if(n<0)return;
 const entry=data.trash[n],after=data.slides.findIndex(s=>s.id===entry.afterId),before=data.slides.findIndex(s=>s.id===entry.beforeId);
 const index=after>=0?after:before>=0?before+1:Math.min(entry.index,data.slides.length);
 data.trash.splice(n,1);data.slides.splice(index,0,entry.slide);deckChanged(entry.slide.id);
 notify('슬라이드를 '+(index+1)+'번 위치에 복구했습니다.');
}
function renderSlideManager(){
 $('#moveSlideUp').disabled=current===0;$('#moveSlideDown').disabled=current===data.slides.length-1;$('#deleteSlide').disabled=data.slides.length<=1;
 $('#trashCount').textContent=data.trash.length;
 $('#trashList').innerHTML=data.trash.length?data.trash.slice().reverse().map(({slide})=>'<div class="trash-item"><span>'+escapeHTML(slideTitle(slide))+'</span><button type="button" data-restore-slide="'+slide.id+'" aria-label="'+escapeHTML(slideTitle(slide))+' 복구">복구</button></div>').join(''):'<p class="trash-empty">삭제한 슬라이드가 없습니다.</p>';
}
let slideDrag=null,suppressNavClickUntil=0;
function clearSlideDrop(){ $$('#slideNav .drop-before,#slideNav .drop-after').forEach(el=>el.classList.remove('drop-before','drop-after')); }
function updateSlideDrop(){
 if(!slideDrag?.active)return;
 const nav=$('.sidebar'),rect=nav.getBoundingClientRect(),{x,y}=slideDrag;
 if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom){slideDrag.target=null;clearSlideDrop();return;}
 const hit=document.elementFromPoint(x,y)?.closest('.nav-row');clearSlideDrop();slideDrag.target=null;
 if(!hit)return;
 const r=hit.getBoundingClientRect(),after=y>r.top+r.height/2;
 slideDrag.target={id:Number(hit.dataset.slideId),after};hit.classList.add(after?'drop-after':'drop-before');
}
function tickSlideDrag(){
 if(!slideDrag?.active)return;
 const nav=$('.sidebar'),r=nav.getBoundingClientRect(),{x,y}=slideDrag;
 if(x>=r.left&&x<=r.right){if(y<r.top+110)nav.scrollTop-=12;else if(y>r.bottom-55)nav.scrollTop+=12;}
 updateSlideDrop();slideDrag.frame=requestAnimationFrame(tickSlideDrag);
}
function finishSlideDrag(commit){
 if(!slideDrag)return;
 const drag=slideDrag;slideDrag=null;cancelAnimationFrame(drag.frame);clearSlideDrop();document.body.classList.remove('slide-reordering');
 $$('#slideNav .is-dragging').forEach(el=>el.classList.remove('is-dragging'));
 if(drag.handle.hasPointerCapture(drag.pointerId))drag.handle.releasePointerCapture(drag.pointerId);
 if(drag.active)suppressNavClickUntil=performance.now()+300;
 if(commit&&drag.active&&drag.target){
  const from=data.slides.findIndex(s=>s.id===drag.id),target=data.slides.findIndex(s=>s.id===drag.target.id);
  let to=target+(drag.target.after?1:0);if(from<to)to--;
  moveSlide(drag.id,to);$('#slideNav [data-slide-id="'+drag.id+'"] .nav-handle')?.focus({preventScroll:true});
 }
}
function navigateSlideList(index){
 go(index);
 const item=$('#slideNav [aria-current="true"]');if(!item)return;
 item.focus({preventScroll:true});
 const sidebar=$('.sidebar'),bounds=sidebar.getBoundingClientRect(),manager=$('.slide-manager').getBoundingClientRect(),row=item.getBoundingClientRect();
 const top=Math.max(bounds.top,manager.bottom)+8,bottom=bounds.bottom-8;
 if(row.top<top)sidebar.scrollTop-=top-row.top;
 else if(row.bottom>bottom)sidebar.scrollTop+=row.bottom-bottom;
}
function setupSlideManager(){
 $('#moveSlideUp').onclick=()=>moveSlide(currentSlide().id,current-1);
 $('#moveSlideDown').onclick=()=>moveSlide(currentSlide().id,current+1);
 $('#deleteSlide').onclick=()=>{deleteSlide();$('#deleteSlide').focus({preventScroll:true});};
 $('#trashList').addEventListener('click',event=>{const el=event.target.closest('[data-restore-slide]');if(el){restoreSlide(Number(el.dataset.restoreSlide));$('#slideNav [aria-current=true]')?.focus({preventScroll:true});}});
 $('#slideNav').addEventListener('keydown',event=>{
  const item=event.target.closest('[data-slide-nav]');
  if(item&&['ArrowUp','ArrowDown'].includes(event.key)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
   event.preventDefault();event.stopPropagation();
   navigateSlideList(Number(item.dataset.slideNav)+(event.key==='ArrowUp'?-1:1));return;
  }
  const handle=event.target.closest('.nav-handle');if(!handle||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();const id=Number(handle.closest('.nav-row').dataset.slideId),index=data.slides.findIndex(s=>s.id===id);
  moveSlide(id,event.key==='Home'?0:event.key==='End'?data.slides.length-1:index+(event.key==='ArrowUp'?-1:1));
  $('#slideNav [data-slide-id="'+id+'"] .nav-handle')?.focus({preventScroll:true});
 });
 $('#slideNav').addEventListener('pointerdown',event=>{
  const handle=event.target.closest('.nav-handle');if(!handle||event.button!==0||slideDrag)return;
  event.preventDefault();handle.focus({preventScroll:true});handle.setPointerCapture(event.pointerId);
  slideDrag={id:Number(handle.closest('.nav-row').dataset.slideId),handle,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false,target:null};
 });
 document.addEventListener('pointermove',event=>{
  if(!slideDrag||slideDrag.pointerId!==event.pointerId)return;
  slideDrag.x=event.clientX;slideDrag.y=event.clientY;
  if(!slideDrag.active&&Math.hypot(slideDrag.x-slideDrag.startX,slideDrag.y-slideDrag.startY)>5){slideDrag.active=true;slideDrag.handle.closest('.nav-row').classList.add('is-dragging');document.body.classList.add('slide-reordering');tickSlideDrag();}
  if(slideDrag.active){event.preventDefault();updateSlideDrop();}
 },{passive:false});
 document.addEventListener('pointerup',event=>{if(slideDrag?.pointerId===event.pointerId)finishSlideDrag(true);});
 document.addEventListener('pointercancel',()=>finishSlideDrag(false));
 document.addEventListener('keydown',event=>{if(slideDrag&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finishSlideDrag(false);}},true);
 window.addEventListener('blur',()=>finishSlideDrag(false));
}
