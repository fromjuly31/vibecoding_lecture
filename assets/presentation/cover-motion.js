/* Decorative code illustrations, no external assets or animation libraries. */
function codeWindowHead(file,kind,status=''){
 return '<div class="code-window-head"><span class="code-dots"><i></i><i></i><i></i></span><span class="code-file-icon">'+kind+'</span><span>'+file+'</span><span class="code-head-status">'+status+'</span></div>';
}
function codeLines(lines){return '<div class="code-lines">'+lines.map((line,i)=>'<div class="code-line" style="--line:'+i+'"><span class="code-line-number">'+String(i+1).padStart(2,'0')+'</span><span class="code-line-content">'+line+'</span></div>').join('')+'</div>';}
function coverCodeVisual(concept='stack'){
 const html=['<s>&lt;!-- an idea becomes a page --&gt;</s>','<b>&lt;main</b> class=<em>"classroom"</em><b>&gt;</b>','  <b>&lt;h1&gt;</b>Hello, idea.<b>&lt;/h1&gt;</b>','  <b>&lt;button&gt;</b>Let’s create<b>&lt;/button&gt;</b>','<b>&lt;/main&gt;</b>'];
 const css=['<b>.classroom</b> {','  display: <em>grid</em>;','  gap: <em>16px</em>;','  accent-color: <em>#9caaff</em>;','}'];
 const js=['<b>const</b> idea = <em>"a better classroom"</em>;','<b>const</b> app = <b>createApp</b>(idea);','','app.<b>design</b>({ accent: <em>"#9caaff"</em> });','app.<b>build</b>().<b>share</b>();<span class="code-cursor"></span>'];
 let inside='<div class="code-grid"></div><div class="code-orbit"></div>';
 if(concept==='build'){
  const live=['<b>import</b> { createApp } <b>from</b> <em>"idea"</em>;','','<b>const</b> classroom = <b>createApp</b>({','  title: <em>"오늘의 수업"</em>,','  tools: [<em>"출석"</em>, <em>"퀴즈"</em>, <em>"기록"</em>],','  accent: <em>"#9caaff"</em>','});','','classroom.<b>render</b>();<span class="code-cursor"></span>'];
  inside+='<div class="code-window build-editor">'+codeWindowHead('classroom.js','{ }','LIVE')+codeLines(live)+'<div class="build-progress"></div></div><div class="build-connector"></div><div class="build-app"><div class="build-app-bar"><span>PREVIEW / classroom.app</span><span>↗</span></div><div class="build-app-body"><div class="build-app-title">오늘의 수업<small>MADE WITH AN IDEA</small></div><div class="build-app-cards">'+[
   ['<path d="m4 8 3 3 5-6"/>','출석'],['<path d="M6 5a2 2 0 1 1 3 2c-1 1-1 1-1 3m0 2h.01"/>','퀴즈'],['<path d="M4 3h8v10H4zM6 6h4M6 9h4"/>','기록']
  ].map(([icon,name],i)=>'<div class="build-app-card" style="--card:'+i+'"><svg viewBox="0 0 16 16">'+icon+'</svg><span>'+name+'</span></div>').join('')+'</div></div></div><span class="code-bracket">}</span><div class="code-status"><i class="code-status-dot"></i>IDEA → EXPERIENCE</div>';
 }else if(concept==='tower'){
  inside+='<div class="tower-floor"></div><div class="tower-axis"><span>LOGIC</span><span>STYLE</span><span>STRUCTURE</span></div><div class="tower-scene">'+[['html','index.html','&lt;/&gt;',html],['css','style.css','{ }',css],['js','app.js','λ',js]].map(([name,file,kind,lines])=>'<div class="tower-layer layer-'+name+'">'+codeWindowHead(file,kind,'LAYER / '+name.toUpperCase())+codeLines(lines)+'</div>').join('')+'</div><span class="code-bracket">{ }</span><div class="code-status"><i class="code-status-dot"></i>BUILT, LAYER BY LAYER</div>';
 }else{
  concept='stack';inside+=[['back','index.html','&lt;/&gt;',html,'01 / STRUCTURE'],['middle','style.css','{ }',css,'02 / STYLE'],['front','app.js','λ',js,'03 / INTERACTION']].map(([layer,file,kind,lines,status])=>'<div class="code-window stack-'+layer+'">'+codeWindowHead(file,kind,status)+codeLines(lines)+'</div>').join('')+'<span class="code-bracket">&lt;/&gt;</span><div class="code-status"><i class="code-status-dot"></i>ONE IDEA. MANY POSSIBILITIES.</div>';
 }
 return '<div class="code-visual code-'+concept+'" aria-hidden="true">'+inside+'</div>';
}
function coverBrandMarkup(){return '<span class="cover-brand"><span class="cover-brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16"/></svg></span><span>BIBEOM CLASS</span></span>';}
let coverMotionChoice=null;
function syncCoverMotion(initial=false){
 const frame=document.getElementById('slideFrame'),visual=frame?.querySelector('.cover-code-art .code-visual');if(!visual)return;
 const paused=coverMotionChoice??matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(initial&&paused)visual.getAnimations({subtree:true}).forEach(animation=>{animation.currentTime=6200;});
 visual.dataset.motion=paused||document.hidden?'paused':'playing';
 const button=frame.querySelector('.cover-motion-toggle');if(!button)return;
 button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'표지 애니메이션 재생':'표지 애니메이션 일시정지');button.title=button.getAttribute('aria-label');
 button.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="'+(paused?'m5 3 8 5-8 5V3z':'M5 3v10M11 3v10')+'"/></svg>';
}
function resizeCoverCode(){const art=document.querySelector('#slideFrame .cover-code-art');if(art)art.style.setProperty('--cover-code-scale',String(Math.min(art.clientWidth/550,art.clientHeight/500)));}
function setupCoverMotion(){
 document.getElementById('slideFrame').addEventListener('click',event=>{if(!event.target.closest('.cover-motion-toggle'))return;coverMotionChoice=!(coverMotionChoice??matchMedia('(prefers-reduced-motion: reduce)').matches);syncCoverMotion();});
 document.addEventListener('visibilitychange',()=>syncCoverMotion());
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(coverMotionChoice===null)syncCoverMotion(true);});
}
