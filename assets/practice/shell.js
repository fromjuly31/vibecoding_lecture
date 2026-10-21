window.addEventListener('DOMContentLoaded', () => {
  const frames = [...document.querySelectorAll('.practice-frame')];
  const fullscreenButton = document.querySelector('#fullscreenBtn');
  const originalFullscreen = fullscreenButton.onclick;
  const hint = document.createElement('div');
  hint.className = 'practice-fullscreen-hint';
  hint.setAttribute('role', 'status');
  hint.innerHTML = '실습 전체화면 <span><kbd>Esc</kbd>로 해제할 수 있어요</span>';
  document.body.append(hint);
  let hintTimer;
  let focused = false, hadNativeFullscreen = false;
  function sync() {
    frames.forEach(frame => frame.contentWindow?.postMessage({type: 'bibeom-practice-focus', active: focused}, '*'));
    document.querySelectorAll('.practice-toolbar [data-command="fullscreen"]').forEach(button => button.setAttribute('aria-pressed', String(focused)));
  }
  function setFocus(value) {
    focused = value;
    document.body.classList.toggle('practice-focus', value);
    clearTimeout(hintTimer);
    hint.classList.toggle('visible', value);
    if (value) hintTimer = setTimeout(() => hint.classList.remove('visible'), 2800);
    sync();
  }
  async function leave() {
    setFocus(false);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    hadNativeFullscreen = false;
    document.querySelector('.practice-toolbar [data-command="fullscreen"]')?.focus({preventScroll: true});
  }
  fullscreenButton.onclick = async function () {
    if (activeCourse !== 'practice') return originalFullscreen.call(this);
    if (focused) return leave();
    setFocus(true);
    hadNativeFullscreen = !!document.fullscreenElement;
  };
  document.addEventListener('fullscreenchange', () => {
    if (focused && document.fullscreenElement) hadNativeFullscreen = true;
    if (hadNativeFullscreen && !document.fullscreenElement) {
      hadNativeFullscreen = false;
      setFocus(false);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && focused && !event.defaultPrevented) leave();
  });
  window.addEventListener('message', event => {
    if (!frames.some(frame => frame.contentWindow === event.source)) return;
    if (event.data?.type === 'bibeom-practice-ready') sync();
    if (event.data?.type === 'bibeom-practice-exit') leave();
    if (event.data?.type === 'bibeom-practice-topic' && ['uiux', 'animation'].includes(event.data.topic)) {
      selectPractice(event.data.topic);
      sync();
      const frame = document.querySelector(event.data.topic === 'uiux' ? '#practiceFrame' : '#animationFrame');
      const focusTopic = () => frame.contentWindow?.postMessage({type: 'bibeom-practice-topic-focus'}, '*');
      if (frame.contentDocument?.querySelector('.practice-topic-trigger')) focusTopic();
      else frame.addEventListener('load', focusTopic, {once: true});
    }
  });
  frames.forEach(frame => frame.addEventListener('load', sync));
  const oldSelectCourse = selectCourse;
  selectCourse = function (course) {
    if (course === 'lecture' && focused) leave();
    return oldSelectCourse(course);
  };
});
