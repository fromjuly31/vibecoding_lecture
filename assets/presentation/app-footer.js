function footerMarkup(design='rule'){
 const author='<span class="footer-author"><span class="footer-school">원주여고</span> <strong>김범준<span class="footer-nickname">(비범쌤)</span></strong></span>';
 if(design==='label')return '<span class="footer-label"><span class="footer-code-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 16"/></svg></span>'+author+'</span>';
 if(design==='rule')return '<span class="footer-rule-copy"><span class="footer-caption">VIBE CODING · ADVANCED</span>'+author+'</span>';
 return author;
}
function setupAppFooter(){
 const footer=document.getElementById('appFooter');if(!footer)return;
 const requested=new URLSearchParams(location.search).get('footer'),design=['signature','label','rule'].includes(requested)?requested:'rule';
 footer.dataset.design=design;footer.innerHTML=footerMarkup(design);
}
