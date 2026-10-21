const RESPONSIVE_PREVIEW = /* RESPONSIVE_PREVIEW */"";
demos.responsive = s => {
  const presets = {pc: 1024, tablet: 720, mobile: 360}, minimum = 320, maximum = 1280;
  s.width ??= presets[s.device] || 1024;
  s.width = Math.max(minimum, Math.min(maximum, Math.round(s.width)));
  $('#demo').innerHTML = `
    <div class="responsive-controls"><div class="row between"><label class="responsive-width-label" for="responsive-width">실습 화면 너비</label><div class="responsive-width-value"><label class="sr-only" for="responsive-width-number">너비 직접 입력, 320에서 1280픽셀</label><input id="responsive-width-number" type="number" min="${minimum}" max="${maximum}" value="${s.width}"><span>px</span></div></div><div class="responsive-range-row"><button id="responsive-narrower" aria-label="너비 40픽셀 줄이기">−</button><input id="responsive-width" type="range" min="${minimum}" max="${maximum}" step="1" value="${s.width}" aria-describedby="responsive-breakpoints"><button id="responsive-wider" aria-label="너비 40픽셀 늘리기">+</button></div><div class="responsive-device-actions">${segmented([['pc','PC','monitor'],['tablet','태블릿','tablet'],['mobile','모바일','phone']], Object.keys(presets).find(key => presets[key] === s.width), 'data-device')}</div></div>
    <div class="responsive-breakpoints" id="responsive-breakpoints"><span data-breakpoint="1"><b>모바일 · 1열 목록</b>하단 메뉴 · 작은 요약</span><span data-breakpoint="2"><b>태블릿 · 2열 카드</b>상단 메뉴 · 가로 카드</span><span data-breakpoint="3"><b>PC · 3열 카드</b>왼쪽 메뉴 · 넓은 배너</span></div>
    <div id="responsive-space"><div class="responsive-holder adjustable" id="responsive-holder"><iframe id="responsive-frame" title="반응형 디자인 실습 화면" sandbox="allow-same-origin"></iframe></div></div><p class="device-measure" id="responsive-measure" role="status" aria-live="polite"></p>`;
  const frame = $('#responsive-frame');
  frame.srcdoc = RESPONSIVE_PREVIEW;
  const resize = () => {
    const space = $('#responsive-space');
    if (!space?.clientWidth) return;
    const columns = s.width <= 480 ? 1 : s.width <= 800 ? 2 : 3;
    const width = Math.min(space.clientWidth, s.width), scale = width / s.width;
    // The fullscreen sheet fills its flex slot, including on tall displays.
    const focus = document.body.classList.contains('practice-focus');
    const displayHeight = focus ? space.clientHeight : Math.max(260, Math.round(innerHeight * .58));
    frame.style.width = s.width + 'px';
    frame.style.height = Math.ceil(displayHeight / scale) + 'px';
    frame.style.transform = `scale(${scale})`;
    $('#responsive-holder').style.width = width + 'px';
    $('#responsive-holder').style.height = displayHeight + 'px';
    const layout = columns === 1 ? '하단 메뉴 · 가로형 학생 목록 · 간결한 요약' : columns === 2 ? '상단 메뉴 · 2열 가로 카드' : '왼쪽 메뉴 · 3열 세로 카드 · 넓은 배너';
    $('#responsive-measure').innerHTML = `<strong>${s.width}px</strong> · ${layout}${scale < .99 ? ` · 화면에 맞춤 ${Math.round(scale * 100)}%` : ''}`;
    $('#responsive-width').setAttribute('aria-valuetext', `${s.width}픽셀, ${layout}`);
    $$('[data-breakpoint]', $('#demo')).forEach(el => el.classList.toggle('active', +el.dataset.breakpoint === columns));
  };
  const setWidth = value => {
    if (!Number.isFinite(value)) return;
    s.width = Math.max(minimum, Math.min(maximum, Math.round(value)));
    $('#responsive-width').value = s.width;
    $('#responsive-width-number').value = s.width;
    $('#responsive-narrower').disabled = s.width === minimum;
    $('#responsive-wider').disabled = s.width === maximum;
    $$('[data-device]', $('#demo')).forEach(el => el.setAttribute('aria-pressed', String(presets[el.dataset.device] === s.width)));
    resize();
  };
  const ro = new ResizeObserver(resize);
  ro.observe($('#responsive-space'));
  disposers.push(() => ro.disconnect());
  on(window, 'resize', resize);
  on(frame, 'load', () => {
    resize();
    // Keyboard events inside the exercise iframe do not bubble to its parent.
    on(frame.contentDocument, 'keydown', event => {
      if (event.key === 'Escape' && !event.defaultPrevented && document.body.classList.contains('practice-focus')) {
        parent.postMessage({type: 'bibeom-practice-exit'}, '*');
      }
    });
  });
  setWidth(s.width);
  on('#responsive-width', 'input', e => setWidth(+e.target.value));
  on('#responsive-width-number', 'input', e => { if (e.target.valueAsNumber >= minimum && e.target.valueAsNumber <= maximum) setWidth(e.target.valueAsNumber); });
  on('#responsive-width-number', 'change', e => setWidth(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : s.width));
  on('#responsive-narrower', 'click', () => setWidth(s.width - 40));
  on('#responsive-wider', 'click', () => setWidth(s.width + 40));
  many('[data-device]', 'click', e => setWidth(presets[e.currentTarget.dataset.device]));
};
