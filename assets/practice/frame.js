(() => {
  const kind = document.body.dataset.practiceKind;
  const sidebar = document.querySelector('.sidebar');
  const help = document.querySelector(kind === 'uiux' ? '.detail-column' : '.help-grid');
  const helpAnchor = document.createComment('Practice help original position');
  help.before(helpAnchor);
  const helpBeside = matchMedia('(min-width: 1000px)');
  help.tabIndex = 0;
  help.setAttribute('aria-label', '실습 설명과 적용 프롬프트');
  const tools = document.createElement('div');
  tools.className = 'focus-tools focus-only';
  tools.innerHTML = '<div class="practice-topic-picker"><span class="focus-topic-label" id="practice-topic-label">실습 주제</span><button type="button" class="practice-topic-trigger" aria-labelledby="practice-topic-label practice-topic-value" aria-haspopup="listbox" aria-expanded="false" aria-controls="practice-topic-menu"><span id="practice-topic-value"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="practice-topic-menu" id="practice-topic-menu" role="listbox" aria-label="실습 주제" hidden><button type="button" role="option" data-topic="uiux" tabindex="-1"><span>UI/UX<small>25가지 용어</small></span><i aria-hidden="true">✓</i></button><button type="button" role="option" data-topic="animation" tabindex="-1"><span>애니메이션<small>22가지 용어</small></span><i aria-hidden="true">✓</i></button></div></div>';
  sidebar.prepend(tools);
  const topicTrigger = tools.querySelector('.practice-topic-trigger');
  const topicMenu = tools.querySelector('.practice-topic-menu');
  const topicOptions = [...topicMenu.querySelectorAll('[role="option"]')];
  tools.querySelector('#practice-topic-value').textContent = kind === 'uiux' ? 'UI/UX · 25가지' : '애니메이션 · 22가지';
  topicOptions.forEach(option => option.setAttribute('aria-selected', String(option.dataset.topic === kind)));
  function closeTopics(restore = false) {
    topicMenu.hidden = true;
    topicTrigger.setAttribute('aria-expanded', 'false');
    if (restore) topicTrigger.focus({preventScroll: true});
  }
  function openTopics() {
    topicMenu.hidden = false;
    topicTrigger.setAttribute('aria-expanded', 'true');
    topicOptions.find(option => option.dataset.topic === kind).focus({preventScroll: true});
  }
  topicTrigger.addEventListener('click', () => topicMenu.hidden ? openTopics() : closeTopics(true));
  tools.addEventListener('keydown', event => {
    if (['Enter', ' '].includes(event.key) && topicOptions.includes(event.target)) {
      event.preventDefault(); event.stopPropagation(); event.target.click(); return;
    }
    if (event.key === 'Escape' && !topicMenu.hidden) {
      event.preventDefault(); event.stopPropagation(); closeTopics(true); return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (topicMenu.hidden) { openTopics(); return; }
    const currentOption = topicOptions.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? topicOptions.length - 1 : (currentOption + (event.key === 'ArrowDown' ? 1 : -1) + topicOptions.length) % topicOptions.length;
    topicOptions[next].focus({preventScroll: true});
  });
  topicOptions.forEach(option => option.addEventListener('click', () => {
    closeTopics(true);
    if (option.dataset.topic !== kind) parent.postMessage({type: 'bibeom-practice-topic', topic: option.dataset.topic}, '*');
  }));
  tools.addEventListener('focusout', event => { if (!tools.contains(event.relatedTarget)) closeTopics(); });
  document.addEventListener('click', event => { if (!tools.contains(event.target)) closeTopics(); });
  const heading = document.querySelector(kind === 'uiux' ? '.experience-head' : '.demo-top');
  const title = document.createElement('div');
  title.className = 'focus-lesson-title focus-only';
  title.innerHTML = '<h1></h1><p></p>';
  heading.prepend(title);
  const updateTitle = () => {
    const term = TERMS[current];
    title.querySelector('h1').textContent = kind === 'uiux' ? term.ko : term.name;
    title.querySelector('p').textContent = term.en;
  };
  updateTitle();
  const dialog = document.createElement('dialog');
  dialog.className = 'practice-help-dialog';
  dialog.setAttribute('aria-labelledby', 'practice-help-title');
  dialog.innerHTML = '<div class="practice-help-heading"><strong id="practice-help-title">설명 · 적용 프롬프트</strong><button type="button" aria-label="설명 닫기">닫기 ×</button></div>';
  document.body.append(dialog);
  const helpButton = document.createElement('button');
  helpButton.className = 'focus-only focus-help-button';
  helpButton.textContent = '설명 · 프롬프트';
  helpButton.setAttribute('aria-haspopup', 'dialog');
  heading.append(helpButton);
  const exit = document.createElement('button');
  exit.type = 'button';
  exit.className = 'focus-exit focus-only';
  exit.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5"/></svg><span>전체화면 해제</span>';
  exit.addEventListener('click', () => parent.postMessage({type: 'bibeom-practice-exit'}, '*'));
  heading.append(exit);
  helpButton.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (helpButton.offsetParent) helpButton.focus({preventScroll: true}); });
  const mobile = document.createElement('div');
  mobile.className = 'focus-mobile-tools focus-only';
  mobile.innerHTML = '<button type="button" aria-label="실습 목차 열기">☰ 목차</button>';
  heading.prepend(mobile);
  mobile.firstElementChild.addEventListener('click', () => document.querySelector('#open-nav').click());
  if (kind === 'uiux') {
    const originalNav = setNav;
    setNav = function (open) {
      originalNav(open);
      if (!open && document.body.classList.contains('practice-focus') && matchMedia('(max-width:700px)').matches) mobile.firstElementChild.focus({preventScroll: true});
    };
  } else {
    const originalNav = nav;
    nav = function (open) {
      originalNav(open);
      if (!open && document.body.classList.contains('practice-focus') && matchMedia('(max-width:700px)').matches) mobile.firstElementChild.focus({preventScroll: true});
    };
  }
  const reset = kind === 'uiux' && document.querySelector('#reset-demo');
  const resetAnchor = reset && document.createComment('Reset original position');
  if (reset) { reset.before(resetAnchor); reset.classList.add('activity-reset'); }
  function placeActions() {
    if (kind !== 'uiux') {
      document.querySelector('.actions').append(helpButton);
      return;
    }
    if (!document.body.classList.contains('practice-focus')) {
      resetAnchor.after(reset);
      heading.append(helpButton);
      document.querySelector('.activity-action-row')?.remove();
      return;
    }
    let target = document.querySelector('#demo .demo-toolbar, #demo .responsive-device-actions');
    if (!target) {
      target = document.querySelector('.activity-action-row');
      if (!target) {
        target = document.createElement('div');
        target.className = 'activity-action-row';
        document.querySelector('#demo').prepend(target);
      }
    }
    target.append(reset, helpButton);
  }
  if (kind === 'uiux') {
    const originalMount = mount;
    mount = function (...args) {
      resetAnchor.after(reset);
      heading.append(helpButton);
      const result = originalMount(...args);
      placeActions();
      return result;
    };
  }
  function placeHelp() {
    if (!document.body.classList.contains('practice-focus') || helpBeside.matches) {
      if (dialog.open) dialog.close();
      helpAnchor.after(help);
    } else {
      dialog.append(help);
    }
  }
  helpBeside.addEventListener('change', () => {
    placeHelp();
    window.dispatchEvent(new Event('resize'));
  });
  function focus(value) {
    document.body.classList.toggle('practice-focus', value);
    closeTopics();
    if (!value) {
      if (dialog.open) dialog.close();
    }
    placeHelp();
    placeActions();
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));
  }
  window.addEventListener('message', event => {
    if (event.source === parent && event.data?.type === 'bibeom-practice-focus') focus(!!event.data.active);
    if (event.source === parent && event.data?.type === 'bibeom-practice-topic-focus') topicTrigger.focus({preventScroll: true});
  });
  const originalActivate = activate;
  activate = function (...args) {
    const result = originalActivate(...args);
    updateTitle();
    document.querySelector('.demo-wrap')?.scrollTo(0, 0);
    return result;
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && (document.querySelector('dialog[open],.sidebar.open,.context-menu:not([hidden]),.combo-menu:not([hidden]),.practice-topic-menu:not([hidden])') || document.body.classList.contains('nav-open'))) event.practiceInteraction = true;
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !document.body.classList.contains('practice-focus') || event.defaultPrevented || event.practiceInteraction) return;
    if (document.querySelector('dialog[open],.context-menu:not([hidden]),.combo-menu:not([hidden])') || document.body.classList.contains('nav-open')) return;
    parent.postMessage({type: 'bibeom-practice-exit'}, '*');
  });
  parent.postMessage({type: 'bibeom-practice-ready'}, '*');
})();
