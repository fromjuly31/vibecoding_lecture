// Version 5 replaces the eight API demos; earlier schemas are only for importing saved decks.
const V4_DEFAULT=copy(DEFAULT);
const API_CATALOG=/* API_CATALOG_DATA */[];
const API_IMAGE_SOURCES=JSON.parse(document.querySelector('#api-image-source')?.textContent||'{}');
const REMOVED_API_IDS=new Set([10,1100,1101,1102,1103,1104,1200,1201]);
function apiShowcaseData(previous){
 const deck=copy(previous),at=deck.slides.findIndex(s=>REMOVED_API_IDS.has(s.id));
 const slides=API_CATALOG.map(item=>({...copy(item),type:'apiShowcase',part:3,image:'assets/api/'+item.slug+'.png',notes:item.note+'\n공식 안내 확인: 2026.10.18\n'+item.sources.join('\n')}));
 deck.slides=deck.slides.filter(s=>!REMOVED_API_IDS.has(s.id));
 deck.slides.splice(at,0,...slides);
 deck.layouts=Object.fromEntries(Object.entries(deck.layouts||{}).filter(([id])=>!REMOVED_API_IDS.has(Number(id))));
 deck.version=5;return deck;
}
Object.assign(DEFAULT,apiShowcaseData(V4_DEFAULT));
function renderApiShowcaseSlide(i,printing){
 const d=currentAt(i),url=safeUrl(d.url),host=url?new URL(url).hostname.replace(/^www\./,''):'링크 확인',total=data.slides.length;
 const image=API_IMAGE_SOURCES[d.image]||d.image;
 const link=url?'<a class="api-official-link" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(host)+icon('external')+'</a>':'<span class="api-info-value">링크를 확인해 주세요.</span>';
 return '<article class="slide api-showcase-slide" data-slide="'+i+'" data-type="apiShowcase" aria-label="슬라이드 '+(i+1)+' · '+escapeHTML(d.title)+'">'+
  '<header class="slide-head api-showcase-head"><div class="api-title-row">'+S(i,'title','h1','',printing)+'<div class="api-showcase-category">'+S(i,'category','span','',printing)+'<span>'+String(API_CATALOG.findIndex(x=>x.id===d.id)+1).padStart(2,'0')+' / '+API_CATALOG.length+'</span></div></div>'+S(i,'subtitle','p','api-description',printing)+'</header>'+
  '<div class="slide-content"><div class="content-inner"><figure class="api-showcase-figure"><img src="'+escapeHTML(image)+'" data-asset="'+escapeHTML(d.image)+'" width="2400" height="900" alt="'+escapeHTML(d.appTitle)+' — 구현 화면 예시" decoding="sync"></figure>'+
  '<div class="api-showcase-info"><div><span class="api-info-label">주요 기능</span>'+S(i,'features','p','api-info-value',printing)+'</div><div>'+S(i,'linkLabel','div','api-info-label',printing)+link+'</div><div><span class="api-info-label">이용 비용</span>'+S(i,'cost','p','api-info-value',printing)+'</div></div>'+S(i,'note','p','api-policy-note',printing)+'</div></div>'+
  '<footer class="slide-foot"><span class="foot-brand">'+txt('meta.title','span','',printing)+'</span><span>정책 확인 2026.10.18 · 구현 화면 예시</span><span class="foot-page"><b>'+String(i+1).padStart(2,'0')+'</b> / '+total+'</span></footer><div class="slide-progress" style="width:'+((i+1)/total*100)+'%"></div></article>';
}
