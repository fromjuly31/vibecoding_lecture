// Version 8: separate general concepts from concise, reusable design examples.
const V7_DEFAULT=copy(DEFAULT);
function teacherPresentation(previous){
 if(previous.version>=8)return previous;
 const deck=copy(previous),byId=id=>deck.slides.find(s=>s.id===id),oldById=id=>V7_DEFAULT.slides.find(s=>s.id===id);
 const replace=(slide,old,key,value)=>{if(slide[key]===old[key])slide[key]=value;};
 const ux=byId(1301),oldUX=oldById(1301);
 replace(ux,oldUX,'title','UX. 얼마나 쉽고 편리하게 쓰는가');
 replace(ux.example,oldUX.example,'task','사용자 경험 · 앱을 쓰면서 느끼는 편리함과 만족감');
 replace(ux.example,oldUX.example,'appTitle','학생 명단 · 김서연 찾기');
 replace(ux,oldUX,'notes','UX는 사용자가 앱을 이용하며 겪는 전반적인 경험입니다. 이 장에서는 편리함을 중심으로 설명합니다. 같은 학생 명단에서 이름을 하나씩 확인하는 경우와 검색으로 바로 찾는 경우를 비교하세요. 검색은 UX를 설명하는 사례이며, UX 자체의 정의가 아닙니다.');
 const common={beforeLabel:'개선 전',afterLabel:'개선 후',appTitle:'학생 상담 기록',appHint:'예시 화면',student:'김서연',record:'진로 관심 분야와 다음 상담 계획',save:'저장',reset:'초기화',remove:'삭제',promptLabel:'AI에게 요청'};
 const ui=byId(1400),oldUI=oldById(1400);
 replace(ui,oldUI,'title','UI 개선 전·후');
 replace(ui,oldUI,'notes','대표적인 UI 개선은 중요한 동작이 한눈에 보이게 만드는 것입니다. 같은 상담 기록, 같은 세 버튼에서 색상과 강조 정도만 비교합니다. 저장은 주요 동작, 초기화와 삭제는 보조 동작으로 구분합니다. 아래 한 문장을 AI에게 요청하는 예시로 읽어 주세요.');
 ui.lesson={...common,focus:'중요한 버튼이 한눈에 보이게',beforeNote:'모든 버튼이 같은 색과 크기',afterNote:'주요 동작은 강조색으로 구분',prompt:'저장 버튼을 강조하고, 초기화와 삭제는 보조 동작으로 구분해 줘.'};
 const feedback=byId(1401),oldFeedback=oldById(1401);
 replace(feedback,oldFeedback,'title','UX 개선 전·후');
 replace(feedback,oldFeedback,'notes','대표적인 UX 개선은 사용자의 동작에 즉시 피드백을 주는 것입니다. 같은 상담 기록 화면에서 저장 버튼을 누른 뒤의 상태를 비교합니다. 왼쪽은 저장 여부가 보이지 않고, 오른쪽은 저장 중·완료를 알려 줍니다. 오른쪽 버튼을 누르면 예시 상태가 다시 재생되며 저장 중 중복 클릭을 막습니다. 실제 상담 정보를 저장하는 기능은 아닙니다. UI와 UX는 서로 영향을 주며, 여기서는 사용자가 결과를 확인하는 경험에 초점을 맞춥니다.');
 feedback.lesson={...common,focus:'내 동작의 결과를 바로 알 수 있게',beforeNote:'저장 여부를 알 수 없음',afterNote:'저장 중·완료 상태를 즉시 확인',prompt:'저장 중에는 중복 클릭을 막고, 끝나면 저장 완료를 알려 줘.',saving:'저장 중…',saved:'저장되었습니다.'};
 deck.version=8;
 return deck;
}
Object.assign(DEFAULT,teacherPresentation(V7_DEFAULT));

function renderTeacherComparison(i,printing){
 const d=currentAt(i),feedback=d.layout==='after',t=(path,tag='span',cls='')=>S(i,'lesson.'+path,tag,cls,printing);
 const action=(path,cls,good)=>feedback&&!printing?'<button type="button" class="lesson-action '+cls+'" data-feedback-save="'+(good?'after':'before')+'" aria-label="'+escapeHTML((good?d.lesson.afterLabel:d.lesson.beforeLabel)+' 상담 기록 저장')+'">'+t(path)+'</button>':t(path,'span','lesson-action '+cls);
 const screen=good=>'<div class="lesson-app '+(!feedback&&good?'priority-clear':'')+'"><div class="lesson-app-heading">'+t('appTitle','strong')+t('appHint','span')+'</div><div class="lesson-record">'+t('student','strong')+t('record','p')+'</div><div class="lesson-actions">'+action('save',feedback?'primary':'save',good)+(feedback?'':action('reset','secondary',good)+action('remove','remove',good))+'</div>'+(feedback?'<div class="lesson-feedback '+(good?'feedback-success':'')+'"'+(printing?'':' role="status" aria-live="polite"')+' data-feedback-status="'+(good?'after':'before')+'">'+(good?icon('check')+t('saved'):'')+'</div>':'')+'</div>';
 return '<div class="teacher-comparison">'+t('focus','p','example-task')+'<div class="example-pair">'+[false,true].map(good=>'<section class="example-case '+(good?'case-good':'case-bad')+'"><div class="example-case-heading">'+t(good?'afterLabel':'beforeLabel','h3')+'</div>'+screen(good)+t(good?'afterNote':'beforeNote','p','example-note')+'</section>').join('')+'</div><div class="teacher-prompt">'+t('promptLabel','span','prompt-caption')+t('prompt','p')+'</div></div>'+quote(i,printing);
}
function mountTeacherExamples(slide){
 const save=slide.querySelector('[data-feedback-save="after"]');if(!save)return;
 const i=current,lesson=currentSlide().lesson,result=slide.querySelector('[data-feedback-status="after"]');
 save.addEventListener('click',()=>{
  if(save.disabled)return;
  save.disabled=true;result.classList.remove('feedback-success');result.setAttribute('aria-busy','true');result.textContent=lesson.saving;
  setTimeout(()=>{
   if(!slide.isConnected)return;
   save.disabled=false;result.classList.add('feedback-success');result.removeAttribute('aria-busy');result.innerHTML=icon('check')+S(i,'lesson.saved');
  },650);
 });
}
