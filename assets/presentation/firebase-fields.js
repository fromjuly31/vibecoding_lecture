// Version 14 adds the screenshot comparison after the Firebase introduction.
const V13_DEFAULT=copy(DEFAULT);
function refreshFirebaseFieldsCopy(deck){
 for(const slide of [...deck.slides,...(deck.trash||[]).map(entry=>entry.slide)]){
  if(slide.id!==7103)continue;
  if(['필드가 달라도, 같은 DB에 저장합니다','파이어베이스 - 특징'].includes(slide.title))slide.title='Firebase · 특징';
  if(slide.focusLabel==='Add field = 항목 추가')slide.focusLabel='필드 = 저장할 항목';
 }
 return deck;
}
function firebaseFieldsPresentation(previous){
 if(previous.version>=14)return refreshFirebaseFieldsCopy(previous);
 const deck=copy(previous),intro=deck.slides.findIndex(s=>s.id===7102),details=deck.slides.findIndex(s=>s.id===702);
 const at=intro>=0?intro+1:details>=0?details:Math.min(37,deck.slides.length);
 deck.slides.splice(at,0,{
  id:7103,type:'firebaseFields',part:2,
  title:'Firebase · 특징',
  subtitle:'Cloud Firestore · Add field에서 필드 이름, 데이터 유형, 값을 지정해 저장합니다.',
  cases:[
   {title:'문자와 숫자를 함께 저장',label:'화면 ①',image:'mixed',alt:'Cloud Firestore의 상품 문서. Add field 아래 category, description, image, price, stock 필드가 저장되어 있습니다.',fields:[{key:'category',value:'"jewelry"',kind:'문자'},{key:'price / stock',value:'168 / 100',kind:'숫자'}]},
   {title:'다른 이름과 개수의 필드도 저장',label:'화면 ②',image:'simple',alt:'Cloud Firestore의 다른 상품 문서. Add field 아래 name과 short_desc 두 필드가 저장되어 있습니다.',fields:[{key:'name',value:'"Product-G"',kind:'문자'},{key:'short_desc',value:'"Product-G Short Desc"',kind:'문자'}]}
  ],
  focusLabel:'필드 = 저장할 항목',
  conclusion:'필드 구성과 데이터 유형이 달라도, 문서로 DB에 보관할 수 있어요.',
  detail:'문서마다 필요한 항목을 담고, 각 필드에는 문자·숫자 등 알맞은 유형의 값을 저장합니다.',
  notes:'약 2분 · 두 첨부 화면의 저장된 필드 영역을 확대해 비교합니다. 주황색 네모는 각 문서에 저장된 필드 이름을 가리킵니다. 왼쪽의 category·description·image·price·stock과 오른쪽의 name·short_desc를 비교하세요. Add field는 항목을 추가하는 버튼입니다. 필드 이름·개수와 값의 유형이 달라도 문서에 저장할 수 있다는 점을 설명하세요. 두 사진은 서로 다른 프로젝트의 예시이며, 같은 DB에서 찍은 화면이라는 뜻은 아닙니다. Cloud Firestore는 같은 컬렉션 안에서도 문서별 필드 구성이 달라질 수 있습니다. image 필드의 값은 이미지 파일 자체가 아니라 URL 문자열입니다.\n공식 근거: https://firebase.google.com/docs/firestore/data-model'
 });
 for(const entry of deck.trash||[])if(entry.index>=at)entry.index++;
 deck.version=14;
 return deck;
}
Object.assign(DEFAULT,firebaseFieldsPresentation(V13_DEFAULT));

function renderFirebaseFields(i,printing){
 const d=currentAt(i);
 const cases=d.cases.map((item,n)=>{
  const p='cases.'+n+'.',t=(path,tag='span',cls='')=>S(i,p+path,tag,cls,printing);
  return '<section class="firestore-case"><div class="firestore-case-heading">'+t('label','span','firestore-case-label')+t('title','h2')+'</div>'+
   '<figure class="firestore-screen firestore-screen-'+(n===0?'mixed':'simple')+'"><img src="'+FIREBASE_SCREENSHOTS[n===0?'mixed':'simple']+'" alt="'+escapeHTML(item.alt)+'" width="1024" height="'+(n===0?846:588)+'">'+(n===0?['category','description','image','price','stock']:['name','short-desc']).map(field=>'<span class="firestore-field-highlight firestore-highlight-'+field+'" aria-hidden="true"></span>').join('')+'</figure>'+
   '<dl class="firestore-fields">'+item.fields.map((field,k)=>'<div>'+t('fields.'+k+'.key','dt')+'<dd>'+t('fields.'+k+'.value','code')+t('fields.'+k+'.kind','span','firestore-value-kind')+'</dd></div>').join('')+'</dl></section>';
 }).join('');
 return '<div class="firestore-comparison">'+cases+'</div><div class="firestore-takeaway">'+S(i,'focusLabel','span','firestore-focus-label',printing)+'<div>'+S(i,'conclusion','p','firestore-conclusion',printing)+S(i,'detail','p','firestore-detail',printing)+'</div></div>';
}
