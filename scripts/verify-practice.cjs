const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const {startBrowser, sleep} = require('./browser-qa.cjs');

const html = fs.readFileSync('index.html', 'utf8');
const baseline = execFileSync('git', ['-c', 'safe.directory=' + process.cwd().replaceAll('\\', '/'), 'show', 'HEAD:index.html'], {encoding: 'utf8', maxBuffer: 30 * 1024 * 1024});
const json = (text, id) => JSON.parse(text.match(new RegExp('<script type="application/json" id="' + id + '">([\\s\\S]*?)<\\/script>'))[1]);
assert.deepEqual(json(html, 'embedded-data'), json(baseline, 'embedded-data'), 'Lecture content, speaker notes, saved layouts and order must be unchanged');
const beforeImages = json(baseline, 'api-image-source'), afterImages = json(html, 'api-image-source');
for (const name of Object.keys(beforeImages)) if (!name.endsWith('/schoolinfo.png')) assert.equal(afterImages[name], beforeImages[name], 'Unchanged API image: ' + name);
console.log('PASS lecture content and unrelated images preserved');

(async () => {
  const b = await startBrowser({port: 8153, debugPort: 9253, width: 1366, height: 768});
  const results = [];
  let frame = 'practiceFrame';
  const run = expr => b.evaluate(`document.querySelector('#${frame}').contentWindow.eval(${JSON.stringify(expr)})`);
  const activate = id => run(`activate(TERMS.findIndex(t => t.id === ${JSON.stringify(id)}))`);
  const check = (name, value) => { assert(value, name); results.push(name); console.log('PASS', name); };
  const setViewport = async (width, height) => { await b.cdp('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false}); await sleep(100); };
  const topic = async kind => {
    frame = kind === 'uiux' ? 'practiceFrame' : 'animationFrame';
    await b.evaluate(`selectPractice('${kind}');selectCourse('practice')`);
    await b.until(`document.querySelector('#${frame}').contentDocument.querySelector('.focus-tools')`);
    await sleep(100);
  };
  try {
    await b.navigate(b.url + '/', 'typeof data!=="undefined"');
    await b.evaluate('localStorage.clear()'); await b.cdp('Page.reload'); await sleep(250); await b.until('document.readyState==="complete" && typeof data!=="undefined"');
    check('70 slides and 9 visible API examples', await b.evaluate('data.slides.length===70 && data.slides.filter(s=>s.type==="apiShowcase").length===9'));
    const apiCounters = await b.evaluate(`data.slides.filter(s=>s.type==='apiShowcase').map(s=>{go(data.slides.indexOf(s));return document.querySelector('.api-showcase-category span:last-child').textContent})`);
    assert.deepEqual(apiCounters, Array.from({length: 9}, (_, i) => String(i + 1).padStart(2, '0') + ' / 9'));
    check('API counter follows visible slide order', true);
    await topic('uiux');
    check('Practice toolbar contains only the fullscreen button', await b.evaluate(`document.querySelector('.practice-toolbar').children.length===1 && !!document.querySelector('.practice-toolbar > [data-command=fullscreen]')`));
    await activate('dashboard');
    check('Dashboard uses the same Korean and English heading as other lessons', await run(`!document.querySelector('.breadcrumb') && document.querySelector('#lesson-english').textContent==='Dashboard' && document.querySelector('#lesson-english').getBoundingClientRect().height>0`));
    await activate('responsive');
    await b.evaluate('document.querySelector(".practice-toolbar [data-command=fullscreen]").click()');
    await b.until('document.body.classList.contains("practice-focus")'); await sleep(250);
    check('Practice fills the window with its own fullscreen hint', await b.evaluate('!document.fullscreenElement && document.querySelector(".practice-fullscreen-hint").classList.contains("visible")'));
    check('Practice headers hidden in fullscreen', await run(`document.body.classList.contains('practice-focus') && getComputedStyle(document.querySelector('.app-header')).display==='none' && getComputedStyle(document.querySelector('.page-heading')).display==='none'`));
    await run(`document.querySelector('.practice-topic-trigger').click()`);
    check('Practice topic uses a custom list with the current selection', await run(`!document.querySelector('.focus-tools select')&&!document.querySelector('.practice-topic-menu').hidden&&document.querySelector('[data-topic=uiux]').getAttribute('aria-selected')==='true'`));
    await b.cdp('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    await b.cdp('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    check('Escape closes the topic list without leaving fullscreen', await run(`document.querySelector('.practice-topic-menu').hidden&&document.body.classList.contains('practice-focus')&&document.activeElement.classList.contains('practice-topic-trigger')`));
    await run(`document.querySelector('.practice-topic-trigger').click()`);
    for (const [key, code] of [['ArrowDown',40],['Enter',13]]) {
      await b.cdp('Input.dispatchKeyEvent', {type: 'keyDown', key, code: key, windowsVirtualKeyCode: code});
      await b.cdp('Input.dispatchKeyEvent', {type: 'keyUp', key, code: key, windowsVirtualKeyCode: code});
    }
    await b.until(`activePractice==='animation'&&document.querySelector('#animationFrame').contentDocument.querySelector('.practice-topic-trigger')`); await sleep(150);
    frame='animationFrame';
    check('Keyboard topic selection opens animation and restores focus', await run(`document.activeElement.classList.contains('practice-topic-trigger')&&document.body.classList.contains('practice-focus')`));
    check('Practice page headings share the same title structure and design', await b.evaluate(`(()=>{const a=document.querySelector('#practiceFrame').contentDocument.querySelector('.brand-name'),b=document.querySelector('#animationFrame').contentDocument.querySelector('.brand-name');return a&&b&&b.textContent.includes('애니메이션 체험관')&&a.parentElement.querySelector('.brand-sub').textContent===b.parentElement.querySelector('.brand-sub').textContent})()`));
    await run(`document.querySelector('.practice-topic-trigger').click();document.querySelector('[data-topic=uiux]').click()`); await sleep(150);
    frame='practiceFrame';
    check('Reset stays with the exercise while the heading keeps only exit', await run(`!!document.querySelector('#demo #reset-demo')&&!document.querySelector('.experience-head #reset-demo')&&!!document.querySelector('.experience-head .focus-exit')`));
    for (const width of [320, 360, 480, 481, 720, 800, 801, 1024, 1280]) {
      await run(`document.querySelector('#responsive-width').value=${width};document.querySelector('#responsive-width').dispatchEvent(new Event('input'))`);
      await sleep(80);
      const actual = await run(`(()=>{const f=document.querySelector('#responsive-frame'),d=f.contentDocument,w=f.contentWindow;return {width:w.innerWidth,overflow:d.documentElement.scrollWidth>w.innerWidth+1,side:w.getComputedStyle(d.querySelector('.side')).display,top:w.getComputedStyle(d.querySelector('.topnav')).display,bottom:w.getComputedStyle(d.querySelector('.bottomnav')).display,card:w.getComputedStyle(d.querySelector('.student')).flexDirection}})()`);
      assert.equal(actual.width, width); assert.equal(actual.overflow, false, JSON.stringify(actual));
      if (width <= 480) assert(actual.side === 'none' && actual.top === 'none' && actual.bottom === 'flex' && actual.card === 'row');
      else if (width <= 800) assert(actual.side === 'none' && actual.top === 'flex' && actual.bottom === 'none' && actual.card === 'row');
      else assert(actual.side !== 'none' && actual.top === 'none' && actual.bottom === 'none' && actual.card === 'column');
    }
    check('Responsive preview changes navigation, card style and layout at actual viewport breakpoints', true);
    await run(`document.querySelector('#reset-demo').click()`);
    check('Moved reset button still resets the exercise', await run(`document.querySelector('#responsive-width').value==='1024'&&!!document.querySelector('#demo #reset-demo')`));
    await activate('modal');
    await run(`document.querySelector('#open-modal').focus();document.querySelector('#open-modal').click();document.querySelector('#edit-name').value='수정 확인';document.querySelector('#edit-form').requestSubmit()`);
    check('Modal save restores focus after re-render', await run(`document.activeElement.id==='open-modal' && states.modal.student.name==='수정 확인'`));
    await activate('context');
    await run(`document.querySelector('[data-context-open="0"]').click();document.querySelector('[data-context-action=edit]').click();document.querySelector('#dialog-cancel').click()`); await sleep(60);
    check('Context edit cancel restores focus to visible trigger', await run(`document.activeElement.dataset.contextOpen==='0'`));
    await run(`document.querySelector('[data-context-open="0"]').click();document.querySelector('[data-context-action=edit]').click();document.querySelector('#edit-form').requestSubmit()`);
    check('Context edit save restores focus after re-render', await run(`document.activeElement.dataset.contextOpen==='0'`));
    await activate('inline');
    check('Inline editing definition corrected', await run(`document.querySelector('#concept-text').textContent.endsWith('수정하는 방식입니다.')`));
    check('Explanation and prompt stay in the right column on desktop', await run(`(()=>{const h=document.querySelector('.detail-column'),a=document.querySelector('.experience');return !h.closest('dialog')&&h.getBoundingClientRect().left>=a.getBoundingClientRect().right&&h.getBoundingClientRect().height>0&&!!h.querySelector('#copy-prompt')})()`));
    await setViewport(900, 700);
    await run(`document.querySelector('.focus-help-button').click()`);
    check('Narrow screens retain explanation and copy prompt in the help dialog', await run(`document.querySelector('.practice-help-dialog').open && !!document.querySelector('.practice-help-dialog #copy-prompt')`));
    await run(`document.querySelector('.practice-help-heading button').click()`); await sleep(30);
    check('Help closes and returns focus', await run(`document.activeElement.classList.contains('focus-help-button')`));
    await setViewport(1366, 768);
    await topic('animation');
    await activate('highlight');
    await run(`setReduced(false);values().d=1.2;mount()`);
    check('Highlight starts unpainted', await run(`getComputedStyle(document.querySelector('mark'),'::before').transform==='matrix(0, 0, 0, 1, 0, 0)'`));
    await run(`document.querySelector('#try-action').click()`); await sleep(350);
    const progress = await run(`Number(getComputedStyle(document.querySelector('mark'),'::before').transform.split('(')[1].split(',')[0])`);
    check('Highlight visibly progresses between empty and complete', progress > 0 && progress < 1);
    await b.screenshot('.qa/practice-highlight-progress.png');
    await sleep(1800);
    check('Both highlight lines finish painting', await run(`[...document.querySelectorAll('mark')].every(e=>getComputedStyle(e,'::before').transform==='matrix(1, 0, 0, 1, 0, 0)')`));
    await run(`document.querySelector('#replay').click()`);
    check('Highlight replay clears the marks', await run(`!document.querySelector('.highlight-target').classList.contains('marked')`));
    await run('setReduced(true)');
    check('Reduced motion also starts unpainted', await run(`getComputedStyle(document.querySelector('mark'),'::before').transform==='matrix(0, 0, 0, 1, 0, 0)'`));
    await run(`document.querySelector('#try-action').click()`);
    check('Reduced motion paints only after the action', await run(`getComputedStyle(document.querySelector('mark'),'::before').transform==='matrix(1, 0, 0, 1, 0, 0)'`));
    await run('setReduced(false)'); await activate('lazy'); await sleep(1000);
    check('Lazy loading leaves offscreen image sources unset', await run(`document.querySelectorAll('.lazy-photo img[src]').length===0 && document.querySelectorAll('[data-load=waiting]').length===4`));
    await run(`document.querySelector('#try-action').click()`); await sleep(450);
    check('Lazy loading exposes the loading phase before assigning an image', await run(`document.querySelectorAll('[data-load=loading]').length>0 && document.querySelectorAll('.lazy-photo img[src]').length===0`));
    await b.screenshot('.qa/practice-lazy-progress.png'); await sleep(1200);
    check('Visible pictures load while offscreen pictures still wait', await run(`document.querySelectorAll('[data-load=loaded]').length>0 && document.querySelectorAll('[data-load=waiting]').length>0`));
    for (let i = 0; i < 4; i++) { await run(`document.querySelector('#try-action').click()`); await sleep(1200); }
    check('All four images load when reached', await run(`document.querySelectorAll('[data-load=loaded]').length===4 && [...document.querySelectorAll('.lazy-photo img')].every(i=>i.complete&&i.naturalWidth>0)`));
    await run(`document.querySelector('#replay').click()`); await sleep(100);
    check('Lazy replay resets counters and unloads all images', await run(`document.querySelectorAll('.lazy-photo img[src]').length===0`));

    for (const [width, height] of [[1920,1080],[1366,768],[1280,600],[1024,600],[390,844]]) {
      await setViewport(width, height);
      for (const kind of ['uiux', 'animation']) {
        await topic(kind);
        const terms = await run('TERMS.map(t=>t.id)');
        for (const id of terms) {
          await activate(id); await sleep(15);
          const geometry = await run(`({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollHeight,viewport:innerHeight})`);
          assert(geometry.doc <= geometry.width + 2, `${kind}/${id} at ${width}: horizontal overflow ${JSON.stringify(geometry)}`);
          assert(await run(`(()=>{const h=document.querySelector('.focus-lesson-title'),exit=document.querySelector('.focus-exit'),r=exit.getBoundingClientRect(),t=TERMS[current];return h.querySelector('h1').textContent===(t.ko||t.name)&&h.querySelector('p').textContent===t.en&&h.getBoundingClientRect().height>0&&r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth})()`), `${kind}/${id}: current lesson heading and exit remain visible`);
        }
        if (width >= 1000) {
          assert(await run(`(()=>{const h=document.querySelector('${kind === 'uiux' ? '.detail-column' : '.help-grid'}'),a=document.querySelector('${kind === 'uiux' ? '.experience' : '.demo-card'}'),r=h.getBoundingClientRect();return !h.closest('dialog')&&r.left>=a.getBoundingClientRect().right&&r.right<=innerWidth&&r.bottom<=innerHeight+1})()`), `${kind} at ${width}: explanation stays beside the activity and within the screen`);
        }
        check(`${kind}: all ${terms.length} demos mount without horizontal overflow at ${width}x${height}`, true);
        if (kind === 'uiux') {
          await activate('dashboard'); await sleep(50);
          const dashboard = await run(`(()=>{const head=document.querySelector('.experience-head').getBoundingClientRect(),card=document.querySelector('.demo-browser').getBoundingClientRect(),widgets=document.querySelector('.dashboard-overview').getBoundingClientRect();return {gap:card.top-head.bottom,bottom:widgets.bottom,height:widgets.height}})()`);
          assert(dashboard.gap >= 8, 'Dashboard uses the same inset as other activities');
          if (width >= 1000) assert(await run(`document.querySelector('.demo-wrap').scrollHeight<=document.querySelector('.demo-wrap').clientHeight+1`), 'Dashboard summary fits the screen without an outer scrollbar');
          if (height >= 768 && width >= 1000) assert(Math.abs(dashboard.bottom - (height - 38)) < 3, 'Dashboard widgets fill the available height');
          await b.screenshot(`.qa/practice-dashboard-${width}x${height}.png`);
          await activate('responsive');
          await run(`document.querySelector('[data-device=${width < 701 ? 'mobile' : 'pc'}]').click()`); await sleep(100);
          const preview = await run(`document.querySelector('#responsive-holder').getBoundingClientRect().toJSON()`);
          assert(preview.height >= 220, 'Readable preview height');
          assert(preview.bottom >= height - 65 && preview.bottom <= height, 'Practice sheet uses the space to the bottom of the screen: ' + JSON.stringify(preview));
          assert(await run(`document.querySelector('.demo-wrap').scrollHeight<=document.querySelector('.demo-wrap').clientHeight+1`), 'Responsive practice has no redundant outer scrollbar');
          await b.screenshot(`.qa/practice-uiux-${width}x${height}.png`);
        } else {
          await activate('highlight');
          const stage = await run(`document.querySelector('#stage').getBoundingClientRect().toJSON()`);
          assert(stage.height > height * .45, 'Fullscreen activity uses available height');
          await b.screenshot(`.qa/practice-animation-${width}x${height}.png`);
        }
        if (width < 701) {
          await run(`document.querySelector('.focus-mobile-tools button').click()`);
          await sleep(300);
          check(`${kind}: mobile contents opens`, await run(`!document.querySelector('.sidebar').inert && document.querySelector('.sidebar').getBoundingClientRect().left>=-1`));
          await run(`document.querySelector('${kind === 'uiux' ? '#close-nav' : '.nav-close'}').click()`);
          check(`${kind}: mobile contents closes to a visible button`, await run(`document.activeElement===document.querySelector('.focus-mobile-tools button')`));
        }
      }
    }
    await setViewport(1280, 600);
    await b.evaluate('document.documentElement.requestFullscreen()'); await sleep(100);
    await b.evaluate('document.exitFullscreen()'); await sleep(100);
    check('Browser fullscreen exit restores ordinary layout in both frames', await b.evaluate(`!document.body.classList.contains('practice-focus') && [...document.querySelectorAll('.practice-frame')].every(f=>!f.contentDocument.body.classList.contains('practice-focus'))`));
    await topic('uiux');
    await activate('responsive');
    await b.evaluate(`document.querySelector('.practice-toolbar [data-command=fullscreen]').click()`); await sleep(100);
    await run(`document.querySelector('#responsive-frame').contentDocument.querySelector('.brand').focus()`);
    await b.cdp('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    await b.cdp('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27}); await sleep(100);
    check('Escape exits fullscreen even when keyboard focus is inside the exercise', await b.evaluate(`!document.body.classList.contains('practice-focus')`));
    await b.evaluate(`window.originalRequestFullscreen=document.documentElement.requestFullscreen;document.documentElement.requestFullscreen=()=>Promise.reject(Error('test denied'));document.querySelector('.practice-toolbar [data-command=fullscreen]').click()`); await sleep(100);
    check('Focused layout still works if browser fullscreen is unavailable', await b.evaluate(`document.body.classList.contains('practice-focus')&&!document.fullscreenElement`));
    await run(`document.querySelector('.focus-exit').click()`); await sleep(100);
    check('Fallback fullscreen exit works', await b.evaluate(`!document.body.classList.contains('practice-focus')`));
    await b.evaluate(`document.documentElement.requestFullscreen=window.originalRequestFullscreen;selectCourse('lecture');for(const id of ['practice-source','animation-source']){const node=document.getElementById(id),value=JSON.parse(node.textContent);value.html=value.html.replace('</head>','<!--export-current-'+id+'--></head>');node.textContent=JSON.stringify(value)}window.download=content=>window.practiceExport=content;document.querySelector('#exportBtn').click();document.querySelector('#exportMenu [data-command=html]').click()`);
    const length = await b.evaluate('window.practiceExport.length'), chunks = [];
    for (let offset = 0; offset < length; offset += 131072) chunks.push(await b.evaluate(`window.practiceExport.slice(${offset},${offset + 131072})`));
    const exported = chunks.join('');
    check('Lecture export bundles the current HTML of both practice topics', json(exported, 'practice-source').html.includes('export-current-practice-source') && json(exported, 'animation-source').html.includes('export-current-animation-source'));
    check('Offline export includes practice fullscreen code and new demos', exported.includes('id="practice-focus-script"') && exported.includes('lazy-placeholder'));
    fs.writeFileSync('.qa/practice-offline.html', exported);
    await b.cdp('Network.emulateNetworkConditions', {offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0});
    await b.navigate(pathToFileURL(path.resolve('.qa/practice-offline.html')).href, 'typeof data!=="undefined"');
    await topic('uiux'); await activate('responsive');
    await b.until(`document.querySelector('#practiceFrame').contentDocument.querySelector('#responsive-frame')?.contentDocument?.querySelector('.students')`);
    check('Exported practice runs with the network disabled', await run(`!!document.querySelector('#responsive-frame').contentDocument.querySelector('.students')`));
    await b.evaluate(`document.querySelector('.practice-toolbar [data-command=fullscreen]').click()`); await sleep(150);
    check('Offline export also retains fullscreen behavior', await run(`document.body.classList.contains('practice-focus')`));
    check('No browser runtime errors', b.errors.length === 0);
    fs.writeFileSync('.qa/practice-verification.json', JSON.stringify({passed: results, runtimeErrors: b.errors}, null, 2));
    console.log(`Completed ${results.length} checks.`);
  } finally { await b.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
