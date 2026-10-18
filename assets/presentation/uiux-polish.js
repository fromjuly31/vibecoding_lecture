// Version 6: distinct UI/UX examples and one closing statement per idea.
const V5_DEFAULT=copy(DEFAULT);
function ideaIdentity(value){return String(value||'').normalize('NFC').replace(/\s+/g,'').replace(/[.!?。…]+$/g,'');}
function deduplicateIdeas(deck){
 const seen=new Set();
 for(let i=deck.slides.length-1;i>=0;i--){
  const slide=deck.slides[i],key=ideaIdentity(slide.takeaway);
  if(!key)continue;
  if(seen.has(key))slide.takeaway='';else seen.add(key);
 }
 return deck;
}
function hasKeyIdea(i,path='takeaway'){
 const key=ideaIdentity(currentAt(i)[path]);
 return !!key&&!data.slides.slice(i+1).some(slide=>ideaIdentity(slide[path])===key);
}
function polishPresentation(previous){
 if(previous.version===6)return deduplicateIdeas(previous);
 const deck=copy(previous);
 const updates={
  1300:{title:'UI. 무엇을 보고 누르는가',description:'화면 요소의 모양과 배치로 정보를 읽고 조작하게 합니다.',examples:['큰 제목으로 정보 위계 만들기','색상으로 상태 구분하기','명확한 버튼 모양과 이름','한눈에 읽히는 메뉴','일관된 여백과 정렬'],notes:'UI는 사용자가 만나는 화면 요소의 설계입니다. 오른쪽 출결 화면의 번호를 따라 제목, 상태 색상, 버튼, 메뉴, 여백을 짚어 주세요. 각 요소가 무엇을 읽고 어디를 누를지 알려 주는지 설명합니다. 다음 장에서는 화면 한 장을 넘어 목적을 완료하는 전체 흐름을 살펴봅니다.',scene:{label:'화면 요소를 하나씩 살펴보기',appName:'우리 반 출결',heading:'오늘의 출결',className:'1학년 1반 · 30명',summary:'출석 27명',navigation:['출결 관리','학급 알림','통계 보기'],student:'김하늘',studentMeta:'1학년 1반 · 1번',status:'출석',action:'출결 저장',question:'어디를 읽고, 무엇을 누를지 보이나요?'}},
  1301:{title:'UX. 목적까지 어떻게 도달하는가',description:'시작부터 완료까지, 사용자의 망설임과 실수를 줄입니다.',examples:['쉽게 찾기','반복 입력 줄이기','실수 예방하기','완료 확인하기'],notes:'목표는 학생의 출결을 빠르고 확실하게 기록하는 것입니다. 위쪽의 헤매는 흐름과 아래쪽의 세 단계를 비교해 주세요. 최근 학급 유지, 기본값과 오류 예방, 저장 확인과 되돌리기는 작업 전체의 경험을 개선합니다. UI도 UX에 영향을 주며, UX는 화면의 미관뿐 아니라 목적 달성 과정 전체를 다룹니다. 다음 입력에서 두 개념을 연결하는 핵심 문구를 보여 줍니다.',scene:{goal:'학생의 출결을 빠르고 확실하게 기록하기',frictionTitle:'헤매는 흐름',frictionSteps:['메뉴 찾기','학생 찾기','상태 입력','저장 누르기','저장됐나?'],flowTitle:'막힘없는 흐름',steps:[{title:'학생 바로 찾기',detail:'최근 학급을 유지하고 이름으로 검색',sample:'김하늘',benefit:'탐색 시간 줄이기'},{title:'상태 한 번에 선택',detail:'기본값을 제공하고 잘못된 입력 예방',sample:'출석',benefit:'반복 입력 · 실수 줄이기'},{title:'저장 완료 확인',detail:'완료를 즉시 알리고 되돌리기 제공',sample:'저장 완료',benefit:'결과를 확실하게 알기'}]}}
 };
 for(const slide of deck.slides){
  const next=updates[slide.id];if(!next)continue;
  const reference=V5_DEFAULT.slides.find(item=>item.id===slide.id);
  if(slide.title===reference.title)slide.title=next.title;
  if(slide.notes===reference.notes)slide.notes=next.notes;
  if(slide.items[0].description===reference.items[0].description)slide.items[0].description=next.description;
  slide.items[0].examples=slide.items[0].examples.map((text,n)=>text===reference.items[0].examples[n]?next.examples[n]:text);
  if(slide.takeaway===reference.takeaway)slide.takeaway='UI는 화면을 이해하게,\nUX는 일을 끝내게.';
  slide.scene=copy(next.scene);
 }
 deck.version=6;
 return deduplicateIdeas(deck);
}
Object.assign(DEFAULT,polishPresentation(V5_DEFAULT));

function renderUIUXPage(i,printing){
 const d=currentAt(i),text=(path,tag='span',cls='')=>S(i,path,tag,cls,printing);
 const point=n=>'<span class="ui-point" aria-hidden="true">'+n+'</span>';
 const searchIcon='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m16 16 5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
 if(d.layout==='ui')return '<div class="ui-design-board">'+
  '<div class="ui-design-guide"><div class="uiux-name">'+text('items.0.title','h2')+text('items.0.full','p','small-text')+'</div>'+text('items.0.description','p','ui-design-definition')+
   '<ol class="ui-design-points">'+d.items[0].examples.map((_,n)=>'<li>'+point(n+1)+text('items.0.examples.'+n)+'</li>').join('')+'</ol></div>'+
  '<div class="ui-specimen"><div class="ui-specimen-caption">'+text('scene.label')+'<span aria-hidden="true">01—05</span></div>'+
   '<div class="ui-specimen-window"><div class="ui-specimen-top"><span class="ui-app-mark" aria-hidden="true">B.</span>'+text('scene.appName','strong')+'<span class="ui-window-dots" aria-hidden="true">···</span></div>'+
    '<div class="ui-specimen-body"><div class="ui-specimen-nav">'+point(4)+d.scene.navigation.map((_,n)=>text('scene.navigation.'+n,'div',n?'':'active')).join('')+'</div>'+
     '<div class="ui-specimen-main"><div class="ui-specimen-heading">'+point(1)+text('scene.heading','h3')+text('scene.className','p')+'</div>'+
      '<div class="ui-specimen-summary">'+text('scene.summary')+point(2)+'</div>'+
      '<div class="ui-specimen-student"><span class="ui-avatar" aria-hidden="true">김</span><div>'+text('scene.student','strong')+text('scene.studentMeta','small')+'</div>'+text('scene.status','span','ui-attendance-state')+'</div>'+
      '<div class="ui-spacing-guide">'+point(5)+'<span aria-hidden="true"></span></div>'+
      '<div class="ui-specimen-action">'+text('scene.action','span','ui-save-visual')+point(3)+'</div></div></div></div>'+text('scene.question','p','ui-specimen-question')+'</div></div>'+quote(i,printing);
 return '<div class="ux-journey-board"><div class="ux-journey-intro"><div class="uiux-name">'+text('items.0.title','h2')+text('items.0.full','p','small-text')+'</div><div>'+text('items.0.description','p','ux-definition')+text('scene.goal','p','ux-goal')+'</div></div>'+
  '<div class="ux-friction">'+text('scene.frictionTitle','strong')+'<div>'+d.scene.frictionSteps.map((_,n)=>text('scene.frictionSteps.'+n,'span',n===4?'uncertain':'')+(n<4?'<span class="ux-arrow" aria-hidden="true">→</span>':'')).join('')+'</div></div>'+
  '<div class="ux-flow-heading">'+text('scene.flowTitle','strong')+'</div><div class="ux-journey-track">'+d.scene.steps.map((_,n)=>'<section class="ux-journey-step"><div class="ux-step-top"><span class="ux-step-number">0'+(n+1)+'</span>'+text('scene.steps.'+n+'.benefit','span')+'</div>'+text('scene.steps.'+n+'.title','h3')+text('scene.steps.'+n+'.detail','p')+'<div class="ux-step-preview">'+(n===0?searchIcon:icon('check'))+text('scene.steps.'+n+'.sample')+(n===0?'<span class="ux-preview-caret" aria-hidden="true"></span>':'')+'</div></section>').join('')+'</div>'+
  '<div class="ux-outcomes">'+d.items[0].examples.map((_,n)=>text('items.0.examples.'+n,'span')).join('')+'</div></div>'+quote(i,printing);
}

function mountKeyIdea(slide){
 const box=slide.querySelector('.emphasis');if(!box)return;
 // A direct slide child stays independent of fitted content and saved layout offsets.
 slide.append(box);
 if(box.classList.contains('is-shown'))setKeyIdeaBackground(slide,true);
}
function setKeyIdeaBackground(slide,inert){
 for(const child of slide.children){
  if(child.classList.contains('emphasis'))continue;
  child.inert=inert;
  if(inert)child.setAttribute('aria-hidden','true');else child.removeAttribute('aria-hidden');
 }
}
function animateKeyIdea(box){
 if(reducedMotion())return;
 playMotion(box,[{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)'}],{duration:640,easing:'cubic-bezier(.22,1,.36,1)'});
 enterMotion(box.querySelector('.quote'),{y:22,blur:3,delay:220,duration:650});
 enterMotion(box.querySelector('.emphasis-reset'),{y:0,blur:0,delay:550,duration:300});
}
