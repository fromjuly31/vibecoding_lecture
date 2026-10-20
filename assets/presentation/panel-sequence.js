/* Three-part layouts: one centered idea at a time, then the original overview.
   These are content groups, not nested three-column controls or example UI. */
const PANEL_SEQUENCE_GROUPS=[
 '.fund-benefits',
 '.button-anatomy',
 '.architecture-map',
 '.design-quotes .comparison-items',
 '.design-ledger .comparison-items',
 '.design-models .comparison-items',
 '.api-showcase-info',
 '.ux-journey-track'
];
function panelSequence(slide=$('#slideFrame>.slide')){
 if(!slide)return null;
 const group=slide.querySelector(PANEL_SEQUENCE_GROUPS.join(','));
 if(!group)return null;
 const panels=Array.from(group.children).filter(el=>!el.classList.contains('architecture-connection'));
 return panels.length===3?{slide,group,panels}:null;
}
function panelSequenceStep(i=current){return Math.max(0,Math.min(3,state(i).panelStep||0));}
function hasPanelStep(direction){
 return presenting&&!!panelSequence()&&(direction>0?panelSequenceStep()<3:panelSequenceStep()>0);
}
function mountPanelSequence(slide){
 if(!presenting)return;
 const sequence=panelSequence(slide);if(!sequence)return;
 const {group,panels}=sequence,step=panelSequenceStep(Number(slide.dataset.slide));
 slide.classList.add('panel-sequence-slide',step===3?'panel-sequence-overview':'panel-sequence-focus');
 slide.dataset.panelStep=String(step);
 group.classList.add('panel-sequence-group');
 const hide=el=>{el.classList.add('panel-sequence-hidden');el.setAttribute('aria-hidden','true');el.inert=true;};
 if(step<3){
  // Keep the original nodes: links, text, diagrams and saved typography survive.
  for(const child of group.children)if(child!==panels[step])hide(child);
  panels[step].classList.add('panel-sequence-active');
  const content=slide.querySelector('.content-inner');
  for(let node=group;node!==content;node=node.parentElement){
   for(const sibling of node.parentElement.children)if(sibling!==node)hide(sibling);
   node.classList.add('panel-sequence-path');
   // Saved canvas positions are useful in the overview, but a focus must be centered.
   node.style.removeProperty('translate');
   node.style.removeProperty('width');
   node.style.removeProperty('max-width');
  }
  panels[step].style.removeProperty('translate');
  panels[step].style.removeProperty('width');
  panels[step].style.removeProperty('max-width');
  const idea=slide.querySelector('.emphasis');if(idea)hide(idea);
 }
 const status=document.createElement('div');status.className='panel-sequence-status';status.setAttribute('aria-hidden','true');
 status.innerHTML='<span class="panel-sequence-dots">'+[0,1,2,3].map(n=>'<i'+(n===step?' class="active"':'')+'></i>').join('')+'</span><span>'+(step===3?'전체 보기':String(step+1).padStart(2,'0')+' / 03')+'</span>';
 slide.append(status);
}
function setPanelSequenceStep(step){
 if(!presenting||!panelSequence()||!Number.isInteger(step)||step<0||step>3)return false;
 if(panelSequenceStep()===step)return false;
 state(current).panelStep=step;state(current).revealed=false;
 renderCurrent();
 const {panels}=panelSequence();
 if(step===3)panels.forEach((el,n)=>enterMotion(el,{y:14,scale:.98,blur:0,delay:n*65,duration:420}));
 else enterMotion(panels[step],{y:18,scale:.98,blur:0,duration:420});
 const heading=step<3?panels[step].querySelector('h2,h3,.api-info-label,.editorial-label')?.textContent:'';
 $('#slideAnnouncement').textContent=slideTitle(currentSlide())+' · '+(step===3?'세 항목 전체 보기':(step+1)+' / 3 · '+(heading||''));
 $('#stageSpace').scrollTop=0;$('#slideFrame').focus({preventScroll:true});wakeControls();return true;
}
