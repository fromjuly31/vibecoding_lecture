const assert = require('node:assert/strict');
const fs = require('node:fs');
const {startBrowser, sleep} = require('./browser-qa.cjs');

(async () => {
  const b = await startBrowser({port: 8157, debugPort: 9257, width: 1920, height: 1080});
  const results = [];
  const run = expression => b.evaluate(`document.querySelector('#animationFrame').contentWindow.eval(${JSON.stringify(expression)})`);
  const activate = id => run(`activate(TERMS.findIndex(t=>t.id===${JSON.stringify(id)}))`);
  const check = (name, value) => { assert(value, name); results.push(name); console.log('PASS', name); };
  const viewport = async (width, height) => { await b.cdp('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false}); await sleep(100); };
  const endKey = async () => {
    await run(`document.querySelector('.scrollbox').focus({preventScroll:true})`);
    for (const type of ['keyDown','keyUp']) await b.cdp('Input.dispatchKeyEvent',{type,key:'End',code:'End',windowsVirtualKeyCode:35});
    await sleep(500);
  };
  try {
    await b.navigate(b.url+'/', 'typeof data!=="undefined"');
    await b.evaluate(`selectCourse('practice');selectPractice('uiux')`);
    await b.until(`document.querySelector('#practiceFrame').contentDocument.querySelector('.focus-tools')`);
    await b.evaluate(`selectPractice('animation')`);
    await b.until(`document.querySelector('#animationFrame').contentDocument.querySelector('.focus-tools')`);
    check('Motion toggle removed', await run(`!document.querySelector('#reduce-motion,.motion-label')`));

    const pairs = [
      ['.brand-name','.brand-name'],['.brand-sub','.brand-sub'],['.count-badge','.count-badge'],
      ['.sidebar-top strong','.sidebar-top strong'],['.category-button','.category-button'],['.category-count','.category-count'],
      ['.term-button:not([aria-current])','.term[aria-current="false"]'],['.term-button[aria-current="page"]','.term[aria-current="true"]'],
      ['.term-number','.num'],['.page-title-row h1','.title-row h1'],['.english-title','.english'],
      ['.focus-lesson-title h1','.focus-lesson-title h1'],['.focus-lesson-title p','.focus-lesson-title p'],
      ['.practice-topic-trigger','.practice-topic-trigger'], ['.nav-group','.nav-group'], ['.term-list','.term-list']
    ];
    for (const [width,height] of [[1920,1080],[1280,600],[390,844]]) {
      await viewport(width,height);
      for (const focused of [false,true]) {
        if (await b.evaluate(`document.body.classList.contains('practice-focus')`) !== focused) await b.evaluate(`document.querySelector('.practice-toolbar [data-command=fullscreen]').click()`);
        await sleep(100);
        const styles = [];
        for (const [kind,id,index] of [['uiux','practiceFrame',0],['animation','animationFrame',1]]) {
          await b.evaluate(`selectPractice('${kind}')`); await sleep(80);
          styles.push(await b.evaluate(`(()=>{const w=document.querySelector('#${id}').contentWindow;return ${JSON.stringify(pairs)}.map(pair=>{const el=w.document.querySelector(pair[${index}]);if(!el)throw new Error('Missing ${kind} selector '+pair[${index}]);const c=w.getComputedStyle(el);return Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','padding','margin','gap','minHeight','borderRadius'].map(p=>[p,c[p]]));});})()`));
          if(width===1920&&!focused) await b.screenshot('.qa/'+kind+'-typography.png');
        }
        for (let i=0;i<pairs.length;i++) assert.deepEqual(styles[1][i],styles[0][i],`${pairs[i]} at ${width}x${height}, fullscreen=${focused}`);
        check(`UI/UX typography matched at ${width}x${height}, fullscreen=${focused}`,true);
      }
    }
    await run('setReduced(false)');
    const ids = ['parallax','fade','pin','horizontal','snap','progress','highlight','lazy','smooth'];
    for (const [width,height] of [[1920,1080],[1600,1200],[1280,600],[390,844]]) {
      await viewport(width,height);
      for (const id of ids) {
        await activate(id); await sleep(100);
        const before = await run(`(()=>{const box=document.querySelector('.scrollbox'),r=box.getBoundingClientRect();return {height:box.clientHeight,content:box.scrollHeight,stage:document.querySelector('#stage').clientHeight,x:r.x+r.width/2,y:r.y+Math.min(r.height/2,200)}})()`);
        assert(before.content-before.height>=Math.min(180,before.height*.2),`${id} must have a real scroll range at ${width}x${height}: ${JSON.stringify(before)}`);
        assert(Math.abs(before.height-before.stage)<=1,`${id} scrolls inside the activity`);
        if(id==='highlight') assert(await run(`!document.querySelector('.highlight-target').classList.contains('marked')`));
        const initial = await run(`document.querySelector('#status').textContent`);
        await b.cdp('Input.dispatchMouseEvent',{type:'mouseWheel',x:before.x,y:before.y,deltaX:0,deltaY:Math.max(240,before.height*.7)});
        await sleep(id==='lazy'?1300:450);
        assert(await run(`document.querySelector('.scrollbox').scrollTop>0`),`${id}: wheel scrolls the inner region at ${width}x${height}`);
        assert(await run('window.scrollY===0'),`${id}: outer document stays fixed`);
        if(id==='progress') {
          assert(await run(`+document.querySelector('.reading-bar').getAttribute('aria-valuenow')>0`),'Progress bar responds to wheel');
          await endKey();
          assert(await run(`document.querySelector('.reading-bar').getAttribute('aria-valuenow')==='100'`),'Progress reaches 100% using End');
        } else if(id==='highlight') {
          assert(await run(`(()=>{const target=document.querySelector('.highlight-target'),box=document.querySelector('.scrollbox'),r=target.getBoundingClientRect(),b=box.getBoundingClientRect();return target.classList.contains('marked')&&r.bottom>b.top&&r.top<b.bottom})()`),'Wheel paints the visible highlight');
          await run(`document.querySelector('#replay').click()`); await sleep(70);
          assert(await run(`!document.querySelector('.highlight-target').classList.contains('marked')&&document.querySelector('.scrollbox').scrollTop===0`),'Replay restores unpainted scroll state');
        } else if(id==='lazy') {
          assert(await run(`document.querySelectorAll('[data-load="loaded"]').length>0`),'Wheel loads reached images');
        } else if(id==='smooth') {
          await run(`document.querySelector('[data-section="2"]').click()`); await sleep(550);
          assert(await run(`document.querySelector('.scrollbox').scrollTop>document.querySelector('.scrollbox').clientHeight`),'Last navigation section is reachable');
        } else if(id==='fade') {
          assert(await run(`document.querySelectorAll('.fade-card.revealed').length>=2`),'Wheel reveals later cards');
        } else {
          assert.notEqual(await run(`document.querySelector('#status').textContent`),initial,`${id} scroll updates the demonstration`);
        }
      }
      check(`All 9 scroll exercises respond to real wheel input at ${width}x${height}`,true);
    }
    await viewport(1280,600); await activate('progress'); await sleep(100);
    await viewport(1920,1080);
    assert(await run(`document.querySelector('.scrollbox').scrollHeight>document.querySelector('.scrollbox').clientHeight*1.5`),'Scroll range survives resizing a mounted activity');
    await b.screenshot('.qa/animation-progress-fixed.png');
    await activate('highlight'); await sleep(100); await b.screenshot('.qa/animation-highlight-fixed.png');
    check('Mounted scroll exercises adapt to viewport resizing',true);
    check('No browser errors',b.errors.length===0);
    fs.writeFileSync('.qa/animation-verification.json',JSON.stringify({passed:results,errors:b.errors},null,2));
  } finally { await b.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
