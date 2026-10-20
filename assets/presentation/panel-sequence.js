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
function panelMotionBox(element,slide){
 const box=element.getBoundingClientRect(),frame=slide.getBoundingClientRect();
 const scaleX=frame.width/slide.offsetWidth,scaleY=frame.height/slide.offsetHeight;
 return {x:(box.left-frame.left)/scaleX,y:(box.top-frame.top)/scaleY,width:box.width/scaleX,height:box.height/scaleY};
}
function panelOverviewBoxes(sequence){
 const {slide}=sequence;
 if(panelSequenceStep()===3)return sequence.panels.map(el=>panelMotionBox(el,slide));
 // Measure the authored overview offscreen in the same CSS context. No frame of
 // the overview is shown, and no presentation state or saved layout is changed.
 const probe=slide.cloneNode(true);probe.classList.remove('panel-sequence-focus','panel-sequence-overview','panel-sequence-slide');
 probe.classList.add('panel-motion-probe');probe.setAttribute('aria-hidden','true');probe.inert=true;
 probe.querySelector('.panel-sequence-status')?.remove();
 probe.querySelectorAll('.panel-sequence-hidden').forEach(el=>{el.classList.remove('panel-sequence-hidden');el.removeAttribute('aria-hidden');el.inert=false;});
 probe.querySelectorAll('.panel-sequence-path,.panel-sequence-active,.panel-sequence-group').forEach(el=>el.classList.remove('panel-sequence-path','panel-sequence-active','panel-sequence-group'));
 probe.querySelectorAll('[id],[contenteditable],[tabindex]').forEach(el=>{el.removeAttribute('id');el.removeAttribute('contenteditable');el.removeAttribute('tabindex');});
 slide.parentElement.append(probe);
 try{prepareLayout(probe,true);return panelSequence(probe).panels.map(el=>panelMotionBox(el,probe));}
 finally{probe.remove();}
}
function capturePanelMotion(){
 finishSlideTransition();
 const sequence=panelSequence();if(!sequence||reducedMotion())return null;
 const step=panelSequenceStep(),{slide,panels}=sequence;
 return {step,boxes:panels.map(el=>panelMotionBox(el,slide)),snapshot:step<3?captureSlideTransition():null};
}
function panelMotionTransform(base,x,y,scale){return base+' translate3d('+x+'px,'+y+'px,0) scale('+scale+')';}
function animatePanelSequence({from=null,delay=0}={}){
 const sequence=panelSequence();if(!sequence||reducedMotion())return;
 const {slide,panels}=sequence,step=panelSequenceStep(),overview=panelOverviewBoxes(sequence),reading=isReading();
 const center=box=>({x:box.x+box.width/2,y:box.y+box.height/2});
 const home=overview.map(center),content=panelMotionBox(slide.querySelector('.slide-content'),slide);
 const focus=from&&from.step<3?center(from.boxes[from.step]):center(content);
 // The outgoing idea retreats toward its own column before the next one arrives.
 if(from?.snapshot&&step<3){
  const ghost=document.createElement('div');ghost.className='transition-snapshot panel-motion-snapshot';ghost.setAttribute('aria-hidden','true');ghost.inert=true;
  const frame=$('#slideFrame');Object.assign(ghost.style,{inset:'auto',left:frame.offsetLeft+'px',top:frame.offsetTop+'px',width:frame.offsetWidth+'px',height:frame.offsetHeight+'px'});
  ghost.append(from.snapshot);$('#stageSpace').append(ghost);
  const outgoing=panelSequence(from.snapshot).panels[from.step],position=center(from.boxes[from.step]);
  const dx=home[from.step].x-position.x,dy=home[from.step].y-position.y;
  const base=getComputedStyle(outgoing).transform;outgoing.style.transformOrigin='center';
  const exit=playMotion(outgoing,[
   {opacity:1,transform:base},
   {opacity:0,transform:panelMotionTransform(base==='none'?'':base,dx*.65,dy*.65,.72)}
  ],{duration:240,easing:'cubic-bezier(.4,0,.8,.3)',fill:'forwards'});
  exit?.finished.then(()=>ghost.remove(),()=>ghost.remove());delay=180;
 }
 slide.dataset.transition=step===3?'panel-spread':'panel-gather';
 const visible=step===3?panels:[panels[step]];
 visible.forEach((element,n)=>{
  const index=step===3?n:step,to=panelMotionBox(element,slide),destination=center(to);
  let origin=step===3?focus:home[index],scale=step===3?(from?.step===index?1.12:.78):Math.max(.48,Math.min(.76,overview[index].width/to.width));
  if(reading){
   origin=step===3?{x:destination.x,y:destination.y-45}:{x:destination.x+(index-1)*95,y:destination.y+45};
   scale=step===3?.9:.8;
  }
  const dx=origin.x-destination.x,dy=origin.y-destination.y;
  const style=getComputedStyle(element),base=style.transform==='none'?'':style.transform;
  element.style.transformOrigin='center';
  const motion=playMotion(element,[
   {offset:0,opacity:0,transform:panelMotionTransform(base,dx,dy,scale),filter:'blur(3px)'},
   {offset:.22,opacity:1,filter:'blur(0)'},
   {offset:.82,opacity:1,transform:panelMotionTransform(base,-dx*.018,-dy*.018,step===3?1.01:1.025),filter:'blur(0)'},
   {offset:1,opacity:style.opacity,transform:base||'none',filter:style.filter}
  ],{duration:step===3?780:760,delay:delay+(step===3&&index===1?130:0),easing:'cubic-bezier(.22,1,.36,1)'});
  if(motion)motion.id=step===3?'panel-spread':'panel-gather';
 });
 if(step===3){
  const companions=Array.from(slide.querySelector('.content-inner').children).filter(el=>el!==sequence.group&&!el.contains(sequence.group));
  companions.forEach(el=>enterMotion(el,{y:12,blur:0,delay:380,duration:500}));
  slide.querySelectorAll('.architecture-connection').forEach(el=>enterMotion(el,{y:0,blur:0,delay:500,duration:400}));
 }
}
function setPanelSequenceStep(step){
 if(!presenting||!panelSequence()||!Number.isInteger(step)||step<0||step>3)return false;
 if(panelSequenceStep()===step)return false;
 const from=capturePanelMotion();
 state(current).panelStep=step;state(current).revealed=false;
 renderCurrent();
 const {panels}=panelSequence();
 animatePanelSequence({from});
 const heading=step<3?panels[step].querySelector('h2,h3,.api-info-label,.editorial-label')?.textContent:'';
 $('#slideAnnouncement').textContent=slideTitle(currentSlide())+' · '+(step===3?'세 항목 전체 보기':(step+1)+' / 3 · '+(heading||''));
 $('#stageSpace').scrollTop=0;$('#slideFrame').focus({preventScroll:true});wakeControls();return true;
}
