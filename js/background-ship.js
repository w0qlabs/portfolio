(() => {
  const scene = document.querySelector('[data-background-ship]');
  const ship = scene?.querySelector('img');
  const gsap = window.gsap;
  if (!scene || !ship || !gsap) return;
  scene.backgroundFlight?.destroy();

  const media = gsap.matchMedia();
  media.add({ mobile: '(max-width: 620px)', reduced: '(prefers-reduced-motion: reduce)', all: 'all' }, context => {
    const { mobile, reduced } = context.conditions;
    const phase = { value: 0 };
    gsap.set(ship, { x: 0, y: 0, rotation: 0, opacity: mobile ? 0.17 : 0.24, transformOrigin: '50% 50%' });
    const xTo = gsap.quickSetter(ship, 'x', 'px');
    const yTo = gsap.quickSetter(ship, 'y', 'px');
    const rotateTo = gsap.quickSetter(ship, 'rotation', 'deg');
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let size = ship.clientWidth;

    const render = () => {
      if (reduced) {
        xTo(viewportWidth - size - 20);
        yTo(viewportHeight * 0.72);
        rotateTo(0);
        return;
      }
      const t = phase.value;
      const u = 1 - t;
      // One cubic curve, including its tangent, keeps the ship pointing along its flight.
      // Both endpoints are offscreen; the repeat never exposes a position reset.
      const xs = [-size * 1.4, viewportWidth * 0.23, viewportWidth * 0.76, viewportWidth + size * 1.4];
      const ys = [viewportHeight * 0.84, viewportHeight * 0.45, viewportHeight * 0.74, viewportHeight * 0.14];
      const curve = p => u * u * u * p[0] + 3 * u * u * t * p[1] + 3 * u * t * t * p[2] + t * t * t * p[3];
      const tangent = p => 3 * u * u * (p[1] - p[0]) + 6 * u * t * (p[2] - p[1]) + 3 * t * t * (p[3] - p[2]);
      xTo(curve(xs));
      yTo(curve(ys) - size / 2);
      rotateTo(Math.atan2(tangent(ys), tangent(xs)) * 180 / Math.PI + 40);
    };
    const onResize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      size = ship.clientWidth;
      render();
    };
    const flight = reduced ? null : gsap.to(phase, {
      id: 'background-ship-flight', value: 1, duration: mobile ? 48 : 42,
      ease: 'none', repeat: -1, onUpdate: render,
    });
    if (flight) flight.progress(0.15);
    else render();

    const onVisibility = () => flight?.paused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize, { passive: true });
    onVisibility();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, scene);

  const onPageHide = event => {
    if (!event.persisted) scene.backgroundFlight?.destroy();
  };
  window.addEventListener('pagehide', onPageHide);
  scene.backgroundFlight = {
    destroy() {
      media.revert();
      window.removeEventListener('pagehide', onPageHide);
      delete scene.backgroundFlight;
    },
  };
})();
