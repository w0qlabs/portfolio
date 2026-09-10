(() => {
  const scene = document.querySelector('[data-background-ship]');
  const ship = scene?.querySelector('.site-voyager__ship');
  const flame = scene?.querySelector('[data-voyager-flame]');
  const gsap = window.gsap;
  if (!scene || !ship || !flame || !gsap) return;
  scene.backgroundFlight?.destroy();

  const media = gsap.matchMedia();
  media.add({ mobile: '(max-width: 620px)', reduced: '(prefers-reduced-motion: reduce)', all: 'all' }, context => {
    const { mobile, reduced } = context.conditions;
    const phase = { value: 0 };
    gsap.set(ship, { x: 0, y: 0, rotation: 0, transformOrigin: '50% 50%' });
    const xTo = gsap.quickSetter(ship, 'x', 'px');
    const yTo = gsap.quickSetter(ship, 'y', 'px');
    const rotateTo = gsap.quickSetter(ship, 'rotation', 'deg');
    let width, height, offsetX, offsetY, size, topInset;
    let flightScroll = window.scrollY;
    let returning = false;
    let lastFrame = performance.now();

    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      const reserve = size * 0.82;
      const centerX = offsetX + width / 2;
      const centerY = offsetY + (height + topInset) / 2;
      const radiusX = Math.max(0, width / 2 - reserve);
      const radiusY = Math.max(0, (height - topInset) / 2 - reserve);
      if (reduced) {
        xTo(centerX + radiusX - size / 2);
        yTo(centerY + radiusY - size / 2);
        rotateTo(0);
        flame.removeAttribute('transform');
        return;
      }
      const a = phase.value;
      // Keep the flight in document space while visible. Scrolling does not tow it.
      const orbitY = centerY + radiusY * Math.sin(2 * a) - size / 2;
      const scroll = window.scrollY;
      let y = orbitY + flightScroll - scroll;
      if (y + size < offsetY || y > offsetY + height) {
        returning = true;
        // Long jumps restart the approach just beyond the edge, never on-screen.
        const edgeY = Math.max(offsetY - size * 1.2, Math.min(offsetY + height + size * 0.2, y));
        flightScroll += edgeY - y;
      }
      let returnSpeed = 0;
      if (returning) {
        const correction = (scroll - flightScroll) * (1 - Math.exp(-dt / 0.22));
        flightScroll += correction;
        returnSpeed = dt > 0 ? correction / dt : 0;
        if (Math.abs(scroll - flightScroll) < 1) {
          flightScroll = scroll;
          returning = false;
        }
        y = orbitY + flightScroll - scroll;
      }
      const dx = radiusX * Math.cos(a);
      const dy = 2 * radiusY * Math.cos(2 * a);
      const angularSpeed = Math.PI * 2 / (mobile ? 30 : 26);
      xTo(centerX + radiusX * Math.sin(a) - size / 2);
      yTo(y);
      rotateTo(Math.atan2(dy * angularSpeed + returnSpeed, dx * angularSpeed) * 180 / Math.PI + 45);

      // The flame scales in nozzle-local coordinates; its attachment never moves.
      // Integer harmonics keep both the flicker and the flight seamless at repeat.
      const thrust = 1.25 + 0.22 * Math.cos(2 * a) + Math.min(Math.abs(returnSpeed) / 1600, 0.4);
      const pulse = 0.2 * Math.sin(37 * a) + 0.09 * Math.sin(61 * a);
      flame.setAttribute('transform', `scale(${1 + 0.08 * Math.sin(43 * a)} ${thrust + pulse})`);
    };
    const onResize = () => {
      const viewport = window.visualViewport;
      width = viewport?.width ?? window.innerWidth;
      height = viewport?.height ?? window.innerHeight;
      offsetX = viewport?.offsetLeft ?? 0;
      offsetY = viewport?.offsetTop ?? 0;
      // Read the untransformed CSS width, so banking does not change the flight bounds.
      size = parseFloat(getComputedStyle(ship).width);
      topInset = Math.min(height * 0.25, window.innerWidth <= 900 ? 80 : 96);
      render();
    };
    onResize();
    const flight = reduced ? null : gsap.to(phase, {
      id: 'background-ship-flight', value: Math.PI * 2, duration: mobile ? 30 : 26,
      ease: 'none', repeat: -1, onUpdate: render,
    });
    if (flight) flight.progress(0.18);

    const onVisibility = () => {
      flight?.paused(document.hidden);
      scene.classList.toggle('is-flying', Boolean(flight) && !document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize, { passive: true });
    window.visualViewport?.addEventListener('scroll', onResize, { passive: true });
    onVisibility();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      scene.classList.remove('is-flying');
      flame.removeAttribute('transform');
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
