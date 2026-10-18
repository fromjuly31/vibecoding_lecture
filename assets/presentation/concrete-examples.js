// Version 7: teach UI/UX through visible, usable classroom examples.
const V6_DEFAULT=copy(DEFAULT);
function concretePresentation(previous){
 if(previous.version===7)return deduplicateIdeas(previous);
 const deck=copy(previous);
 const replacements={
  1300:{title:'UI. 화면이 어떻게 보이는가',takeaway:'',notes:'두 화면에는 같은 출결 정보가 있습니다. 글자 크기, 색상, 정렬과 여백만 비교합니다. UI에는 버튼 같은 조작 요소도 포함되지만, 이 장에서는 화면의 시각적 설계를 중심으로 설명합니다.',example:{task:'같은 출결 정보, 다른 화면',beforeLabel:'구분하기 어려운 화면',afterLabel:'한눈에 읽히는 화면',appTitle:'오늘의 출결',className:'1학년 1반 · 30명',totalLabel:'전체',presentLabel:'출석',lateLabel:'지각',absentLabel:'결석',beforeNote:'비슷한 글자 크기 · 빽빽한 배치 · 구분 없는 색상',afterNote:'중요한 정보는 크게 · 상태는 색상으로 · 여백은 충분히'}},
  1301:{title:'UX. 원하는 학생을 쉽게 찾는가',takeaway:'UI는 보기 쉽게,\nUX는 사용하기 편하게.',notes:'같은 180명의 학생 명단입니다. 왼쪽은 목록을 내려 이름을 하나씩 찾아야 하고, 오른쪽은 검색창에 이름을 입력하면 바로 찾을 수 있습니다. 오른쪽 검색어를 지우거나 다른 이름으로 바꿔 비교해 보세요. UI는 화면의 표현, UX는 사용자가 앱을 이용하며 겪는 편리함에 초점을 맞춥니다.',example:{task:'학생 180명 중 ‘김서연’ 찾기',beforeLabel:'검색창이 없는 경우',afterLabel:'검색창이 있는 경우',appTitle:'학생 명단',target:'김서연',searchLabel:'학생 이름 검색',searchPlaceholder:'이름을 입력하세요',beforeNote:'명단을 내려 이름을 하나씩 확인',afterNote:'이름을 입력하면 바로 찾기',empty:'검색 결과가 없습니다.'}},
  1400:{title:'개선 전. 과제 안내 보내기',takeaway:'',notes:'목표는 과제를 내지 않은 학생에게만 안내를 보내는 것입니다. 상태 0은 미제출, 1은 제출을 뜻합니다. 표에서 코드를 읽고 대상을 한 명씩 선택한 뒤 실행해야 합니다. 실제 메시지는 발송되지 않는 예시입니다.',example:{task:'미제출 학생에게만 안내 보내기',appTitle:'과제제출관리',assignment:'독서 감상문',className:'1학년 1반',filterLabel:'미제출만 보기',actionLabel:'실행',resultLabel:'처리되었습니다.',note:'상태 0: 미제출 / 1: 제출 · 예시 데이터',points:['숫자 코드를 읽어야 상태를 알 수 있음','안내할 학생을 한 명씩 선택해야 함','버튼 이름만으로 동작을 알기 어려움','누구에게 보냈는지 확인하기 어려움']}},
  1401:{title:'개선 후. 과제 안내 보내기',takeaway:'보기 쉽고 쓰기 편한 프로그램이\n사용자의 시간과 수고를 줄입니다.',notes:'같은 과제와 같은 학생 데이터입니다. 미제출 학생만 바로 보여 주고, 글자와 색상으로 상태를 구분합니다. 버튼에 대상과 인원을 적고 한 번에 안내하도록 했습니다. 버튼을 누르면 대상과 완료 결과가 바로 보입니다. 실제 메시지는 발송되지 않는 예시입니다.',example:{task:'미제출 학생에게만 안내 보내기',appTitle:'과제 제출 현황',assignment:'독서 감상문',className:'1학년 1반',filterLabel:'미제출만 보기',actionLabel:'미제출 학생에게 안내 보내기',resultLabel:'안내 완료',note:'예시 데이터 · 실제 알림은 발송되지 않습니다.',points:['미제출 학생만 바로 표시','글자와 색상으로 상태 구분','누구에게 보내는지 버튼에 표시','한 번에 안내하고 결과 확인']}}
 };
 for(const slide of deck.slides){
  const next=replacements[slide.id];if(!next)continue;
  const old=V6_DEFAULT.slides.find(s=>s.id===slide.id);
  for(const key of ['title','takeaway','notes'])if(slide[key]===old[key])slide[key]=next[key];
  slide.example=copy(next.example);
 }
 if(deck.meta.parts[4]===V6_DEFAULT.meta.parts[4])deck.meta.parts[4]='웹앱의 배포 방식';
 const summary=deck.slides.find(s=>s.id===16),oldSummary=V6_DEFAULT.slides.find(s=>s.id===16);
 const descriptions=[
  '화면·기능·데이터·API가 이어져\n하나의 웹앱이 됩니다.',
  '만들 대상과 원하는 동작을\n구체적으로 설명하고, AI와 함께 고칩니다.',
  '데이터의 형태와 필요한 기능에 맞춰\n백엔드를 선택합니다.',
  '급식·날씨·영상 등 외부 서비스의 정보를\n내 앱에 연결합니다.',
  '앱스 스크립트, GitHub Pages, Netlify 중\n앱에 맞는 배포 방식을 선택합니다.',
  '보기 쉽고 쓰기 편하게 만들어\n사용자의 시간과 수고를 줄입니다.'
 ];
 const customDescriptions=new Map(summary.items.flatMap((item,n)=>item.description!==oldSummary.items[n].description?[[n<4?n:n+1,item.description]]:[]));
 summary.items=descriptions.map((description,n)=>({title:deck.meta.parts[n],description:customDescriptions.get(n)??description}));
 if(summary.title===oldSummary.title)summary.title='웹앱 제작의 여섯 가지 핵심';
 if(summary.notes===oldSummary.notes)summary.notes='약 3분 · 여섯 챕터를 차례로 선택하며 웹앱 제작 과정을 정리합니다. 만들고 싶은 앱 하나를 떠올려 구조, AI 요청, 백엔드, API, 배포, UI/UX를 연결해 보세요.';
 deck.version=7;
 return deduplicateIdeas(deck);
}
Object.assign(DEFAULT,concretePresentation(V6_DEFAULT));

function renderChapterSummary(i,printing){
 const st=state(i),d=currentAt(i);
 return '<div class="summary-editorial chapter-summary"><nav class="summary-terms" aria-label="챕터별 핵심 정리">'+d.items.map((_,n)=>{
  const inner='<span>'+String(n+1).padStart(2,'0')+'</span>'+txt('meta.parts.'+n,'strong','',printing);
  return printing?'<div>'+inner+S(i,'items.'+n+'.description','p','',true)+'</div>':button(inner,'select',n,st.selected===n,st.selected===n?'selected':'');
 }).join('')+'</nav>'+(printing?'':'<div class="summary-definition"><span class="editorial-label">CHAPTER '+String(st.selected+1).padStart(2,'0')+'</span>'+S(i,'items.'+st.selected+'.description','h2','statement')+'</div>')+'</div>'+quote(i,printing);
}

const IDEA_ACCENTS={
 101:['아이디어','구체적인 설명'],203:['입력하고','처리하고','저장하고','연결합니다'],
 303:['AI와 대화하면서 개선'],700:['작은 업무 자동화'],701:['데이터와 검색 조건'],702:['실시간 경험'],
 5100:['데이터와 서버 기능'],1301:['보기 쉽게','사용하기 편하게'],1401:['시간과 수고를 줄입니다'],16:['해결하고 싶은 문제']
};
function keyIdeaMarkup(i,path){
 const text=currentAt(i)[path],preferred=(IDEA_ACCENTS[currentAt(i).id]||[]).filter(part=>text.includes(part));
 const fallback=text.trim().split('\n').filter(Boolean).at(-1);
 const parts=preferred.length?preferred:[fallback];
 const pattern=new RegExp('('+parts.map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','g');
 const body=text.split(pattern).map(part=>parts.includes(part)?'<mark class="idea-accent">'+escapeHTML(part)+'</mark>':escapeHTML(part)).join('');
 return '<div class="quote" data-path="'+escapeHTML(pathFor(i,path))+'">'+body+'</div>';
}

const LESSON_STUDENTS=(()=>{
 const families=['김','이','박','최','정','강','조','윤','장','임'];
 const names=['민준','서연','지우','하은','도윤','서준','민서','예린','수아','지호','하윤','수빈','도현','예준','시우','채원','지민','유진'];
 const list=families.flatMap(family=>names.map(name=>family+name));
 list.splice(137,0,...list.splice(list.indexOf('김서연'),1));
 return list.map((name,n)=>({name,id:n+1,className:'1학년 '+(Math.floor(n/30)+1)+'반',number:n%30+1}));
})();
const HOMEWORK_STUDENTS=[
 {name:'강민준',done:true},{name:'김민지',done:false},{name:'김하늘',done:true},{name:'박지우',done:false},
 {name:'서지민',done:true},{name:'이도윤',done:true},{name:'최서윤',done:false},{name:'한예린',done:true}
];
function studentRows(students,printing=false){
 return students.map(s=>'<'+(printing?'div':'button type="button"')+' class="lookup-row" data-student-id="'+s.id+'"'+(printing?'':' aria-pressed="false"')+'><span class="lookup-number">'+String(s.id).padStart(3,'0')+'</span><strong>'+escapeHTML(s.name)+'</strong><span>'+escapeHTML(s.className)+' · '+s.number+'번</span></'+(printing?'div':'button')+'>').join('');
}
function renderConcreteUIUXPage(i,printing){
 const d=currentAt(i),t=(path,tag='span',cls='')=>S(i,'example.'+path,tag,cls,printing);
 if(d.layout==='ui'){
  const summary=good=>'<div class="attendance-summary">'+[['presentLabel',27],['lateLabel',2],['absentLabel',1]].map(([label,count],n)=>'<div class="attendance-stat stat-'+n+'">'+t(label)+'<strong>'+count+'</strong></div>').join('')+'</div>';
  const students=[['김민지','presentLabel'],['김서연','lateLabel'],['박지우','presentLabel'],['이도윤','absentLabel']];
  const screen=good=>'<div class="attendance-example '+(good?'clear':'dense')+'"><div class="attendance-title">'+t('appTitle','strong')+t('className','span')+'</div>'+summary(good)+'<div class="attendance-records">'+students.map(([name,status])=>'<div><span>'+name+'</span>'+t(status,'span','attendance-status '+status)+'</div>').join('')+'</div></div>';
  return '<div class="concrete-example ui-visual-compare">'+t('task','p','example-task')+'<div class="example-pair">'+[false,true].map(good=>'<section class="example-case '+(good?'case-good':'case-bad')+'"><div class="example-case-heading"><span class="case-index">'+(good?'02':'01')+'</span>'+t(good?'afterLabel':'beforeLabel','h3')+'</div>'+screen(good)+t(good?'afterNote':'beforeNote','p','example-note')+'</section>').join('')+'</div></div>'+quote(i,printing);
 }
 const st=state(i),query=printing?d.example.target:(st.lookupQuery??d.example.target),found=LESSON_STUDENTS.filter(s=>s.name.includes(query.trim()));
 const screen=good=>'<div class="lookup-app"><div class="lookup-app-title">'+t('appTitle','strong')+'<span>전체 '+LESSON_STUDENTS.length+'명</span></div>'+
  (good?'<label class="lookup-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>'+(printing?'<span>'+escapeHTML(query)+'</span>':'<input type="search" data-lookup-search aria-label="'+escapeHTML(d.example.searchLabel)+'" placeholder="'+escapeHTML(d.example.searchPlaceholder)+'" value="'+escapeHTML(query)+'" autocomplete="off">')+'</label>':'')+
  '<div class="lookup-list" data-lookup-list="'+(good?'search':'all')+'" tabindex="0" role="group" aria-label="'+(good?'검색 가능한 학생 명단':'전체 학생 명단')+'">'+studentRows((good?found:LESSON_STUDENTS).slice(0,printing?5:180),printing)+'</div><div class="lookup-result" data-lookup-result="'+(good?'search':'all')+'" role="status">'+(good?'검색 결과 '+found.length+'명':'전체 180명')+'</div></div>';
 return '<div class="concrete-example ux-search-compare">'+t('task','p','example-task')+'<div class="example-pair">'+[false,true].map(good=>'<section class="example-case '+(good?'case-good':'case-bad')+'"><div class="example-case-heading"><span class="case-index">'+(good?'02':'01')+'</span>'+t(good?'afterLabel':'beforeLabel','h3')+'</div>'+screen(good)+t(good?'afterNote':'beforeNote','p','example-note')+'</section>').join('')+'</div></div>'+quote(i,printing);
}
function homeworkRows(good,onlyMissing,printing,selected=[]){
 return HOMEWORK_STUDENTS.map((student,n)=>({...student,n})).filter(s=>!onlyMissing||!s.done).map(s=>'<div class="homework-row"><span class="homework-num">'+String(s.n+1).padStart(2,'0')+'</span><strong>'+s.name+'</strong><span class="homework-state '+(s.done?'done':'missing')+'">'+(good?(s.done?'제출 완료':'미제출'):(s.done?'1':'0'))+'</span>'+(good?'':printing?'<span class="legacy-check">□</span>':'<input type="checkbox" data-homework-person="'+s.n+'" aria-label="'+s.name+' 선택"'+(selected.includes(s.n)?' checked':'')+'>')+'</div>').join('');
}
function renderSchoolworkPage(i,printing){
 const d=currentAt(i),good=d.layout==='after',st=state(i),t=(path,tag='span',cls='')=>S(i,'example.'+path,tag,cls,printing);
 const selected=st.homeworkSelected||[],onlyMissing=printing?true:st.onlyMissing!==false;
 const app='<div class="homework-app '+(good?'homework-clear':'homework-legacy')+'"><div class="homework-top">'+t('appTitle','strong')+t('className','span')+'</div>'+
  '<div class="homework-assignment">'+t('assignment','span')+(good?'<span class="homework-count">미제출 <b>3</b> / 8명</span>':'')+'</div>'+
  (good?'<label class="homework-filter">'+(printing?'✓':'<input type="checkbox" data-homework-filter'+(onlyMissing?' checked':'')+'>')+t('filterLabel')+'</label>':'<div class="homework-legacy-head"><span>NO</span><span>NAME</span><span>STATE</span><span>SEL</span></div>')+
  '<div class="homework-list" data-homework-list>'+homeworkRows(good,good&&onlyMissing,printing,selected)+'</div>'+
  '<div class="homework-actions"><button type="button" data-homework-send'+(printing?' disabled':'')+'>'+t('actionLabel')+(good?'<span>3명</span>':'')+'</button></div>'+
  '<div class="homework-result" data-homework-result role="status">'+(st.homeworkSent?escapeHTML(good?'김민지 · 박지우 · 최서윤 — 안내 완료 (예시)':d.example.resultLabel):'')+'</div>'+t('note','p','homework-footnote')+'</div>';
 return '<div class="concrete-example schoolwork-example">'+t('task','p','example-task')+'<div class="schoolwork-layout">'+app+'<div class="schoolwork-points">'+d.example.points.map((_,n)=>'<div><span>'+String(n+1).padStart(2,'0')+'</span>'+t('points.'+n,'p')+'</div>').join('')+'</div></div></div>'+quote(i,printing);
}
function mountConcreteExamples(slide){
 const d=currentSlide(),st=state(current),search=slide.querySelector('[data-lookup-search]');
 if(search){
  search.addEventListener('input',()=>{
   st.lookupQuery=search.value;
   const students=LESSON_STUDENTS.filter(s=>s.name.includes(search.value.trim()));
   const list=slide.querySelector('[data-lookup-list="search"]');
   list.innerHTML=students.length?studentRows(students):'<p class="lookup-empty">'+escapeHTML(d.example.empty)+'</p>';
   list.scrollTop=0;slide.querySelector('[data-lookup-result="search"]').textContent='검색 결과 '+students.length+'명';
  });
 }
 for(const list of slide.querySelectorAll('[data-lookup-list]')){
  list.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
  list.addEventListener('click',event=>{
   const row=event.target.closest('[data-student-id]');if(!row)return;
   list.querySelectorAll('[data-student-id]').forEach(el=>el.setAttribute('aria-pressed',String(el===row)));
   const student=LESSON_STUDENTS.find(s=>s.id===Number(row.dataset.studentId));
   slide.querySelector('[data-lookup-result="'+list.dataset.lookupList+'"]').textContent=student.name+' · '+student.className+' · '+student.number+'번';
  });
 }
 const filter=slide.querySelector('[data-homework-filter]');
 filter?.addEventListener('change',()=>{st.onlyMissing=filter.checked;slide.querySelector('[data-homework-list]').innerHTML=homeworkRows(true,filter.checked,false)});
 slide.querySelectorAll('[data-homework-person]').forEach(box=>box.addEventListener('change',()=>{st.homeworkSelected=[...slide.querySelectorAll('[data-homework-person]:checked')].map(el=>Number(el.dataset.homeworkPerson))}));
 slide.querySelector('[data-homework-send]')?.addEventListener('click',()=>{
  const result=slide.querySelector('[data-homework-result]');
  if(d.layout==='before'&&!st.homeworkSelected?.length){result.textContent='대상을 선택하세요.';return;}
  st.homeworkSent=true;
  result.textContent=d.layout==='after'?'김민지 · 박지우 · 최서윤 — 안내 완료 (예시)':d.example.resultLabel;
  result.classList.add('sent');
 });
}
