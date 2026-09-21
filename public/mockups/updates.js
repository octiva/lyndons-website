export function mountUpdates(root) {
  if (!root) return () => {};
  const slides = [...root.querySelectorAll('[data-slide]')];
  const dots = [...root.querySelectorAll('[data-show-slide]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = root.querySelector('[data-toggle-updates]');
  const status = root.querySelector('[data-slide-status]');
  let index = 0, paused = motion.matches, timer;
  let hovering = false;
  function show(next, announce = false) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
    root.querySelector('[data-slide-count]').textContent = `${index + 1} / ${slides.length}`;
    if (announce) status.textContent = `Panel ${index + 1} of ${slides.length}: ${slides[index].querySelector('h2').textContent}`;
  }
  function schedule() {
    clearInterval(timer);
    toggle.textContent = paused ? 'Play updates' : 'Pause updates';
    if (!paused && !hovering && !document.hidden) timer = setInterval(() => show(index + 1), 7000);
  }
  const click = event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-toggle-updates')) paused = !paused;
    if (button.hasAttribute('data-show-slide')) { paused = true; show(Number(button.dataset.showSlide), true); }
    if (button.hasAttribute('data-slide-direction')) { paused = true; show(index + Number(button.dataset.slideDirection), true); }
    schedule();
  };
  const enter = () => { if (matchMedia('(hover: hover)').matches) { hovering = true; schedule(); } };
  const leave = () => { hovering = false; schedule(); };
  // Stop on keyboard interaction; only an explicit Play resumes rotation.
  const focus = () => { paused = true; schedule(); };
  const reduced = () => { if (motion.matches) paused = true; schedule(); };
  root.addEventListener('click', click);
  root.addEventListener('mouseenter', enter);
  root.addEventListener('mouseleave', leave);
  root.addEventListener('focusin', focus);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', reduced);
  show(0); schedule();
  return () => {
    clearInterval(timer);
    root.removeEventListener('click', click); root.removeEventListener('mouseenter', enter); root.removeEventListener('mouseleave', leave); root.removeEventListener('focusin', focus);
    document.removeEventListener('visibilitychange', schedule); motion.removeEventListener('change', reduced);
  };
}