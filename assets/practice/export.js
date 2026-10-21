function exportHTML(){
  saveNow();
  const snapshot=copy(data);
  snapshot.deckId='bibeom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  // Always bundle the current embedded exercises, even if neither tab was opened.
  const payloads={
    'embedded-data':snapshot,
    'practice-source':JSON.parse(document.getElementById('practice-source').textContent),
    'animation-source':JSON.parse(document.getElementById('animation-source').textContent)
  };
  let html=ORIGINAL_HTML;
  for(const [id,payload] of Object.entries(payloads)){
    const json=JSON.stringify(payload).replace(/[<>&\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
    const opening='<script type="application/json" id="'+id+'">';
    const start=html.indexOf(opening)+opening.length,end=html.indexOf('<'+'/script>',start);
    if(start<opening.length||end<start)throw new Error('Missing export source: '+id);
    html=html.slice(0,start)+json+html.slice(end);
  }
  download(html,'text/html;charset=utf-8','index.html');
  notify('수정된 강의와 UI/UX·애니메이션 실습을 하나의 HTML로 내보냈습니다.');
}
