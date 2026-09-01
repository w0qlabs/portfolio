(() => {
  const lab = document.querySelector("[data-rocket-system]");
  if (!lab) return;

  const rocketWrap = lab.querySelector(".rocket-wrap");
  const rocketScroll = lab.querySelector(".rocket-scroll");
  const rocketFlight = lab.querySelector(".rocket-flight");
  const rocketDepth = lab.querySelector(".rocket-depth");
  const rocketFloat = lab.querySelector(".rocket-float");
  const rocket = lab.querySelector(".rocket");
  const glint = lab.querySelector(".rocket-window-glint");
  const exhaust = lab.querySelector(".rocket-exhaust");
  const glow = lab.querySelector(".rocket-glow");
  const outerFlame = lab.querySelector(".flame--outer");
  const innerFlame = lab.querySelector(".flame--inner");
  const launchControl = lab.querySelector("[data-launch-rocket]");
  const launchLabel = lab.querySelector("[data-launch-label]");
  const grid = lab.querySelector(".lab-grid");
  const gsap = window.gsap;

  if (!gsap || !rocketWrap || !rocketScroll || !rocketFlight || !rocketDepth || !rocketFloat || !rocket) {
    if (launchControl) launchControl.disabled = true;
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const compactLayout = window.matchMedia("(max-width: 900px)").matches;
  const canUseScrollTrigger = Boolean(window.ScrollTrigger) && !reducedMotion;
  let launching = false;

  if (canUseScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  gsap.set([rocketScroll, rocketFlight, rocketDepth, rocketFloat], {
    transformOrigin: "50% 44%",
  });
  gsap.set(rocketDepth, { transformPerspective: 1000, z: compactLayout || reducedMotion ? 0 : 48 });

  const pinFlamesToNozzle = () => {
    gsap.set(outerFlame, { scaleX: 1, scaleY: 1, opacity: 1, svgOrigin: "110 251" });
    gsap.set(innerFlame, { scaleX: 1, scaleY: 1, opacity: 1, svgOrigin: "110 269" });
  };

  pinFlamesToNozzle();
  const resetExhaust = () => {
    gsap.set(exhaust, { xPercent: -50, scaleX: 0.72, scaleY: 0.45, opacity: 0, transformOrigin: "50% 0%" });
  };

  resetExhaust();
  gsap.set(glow, { transformOrigin: "50% 0%" });

  const ambientAnimations = [];

  if (!reducedMotion) {
    ambientAnimations.push(
      gsap.to(rocketFloat, {
        y: -7,
        rotationZ: 1.05,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      }),
      gsap.to(outerFlame, {
        scaleX: () => gsap.utils.random(0.985, 1.055),
        scaleY: () => gsap.utils.random(1.025, 1.11),
        opacity: () => gsap.utils.random(0.9, 1),
        duration: 0.19,
        repeat: -1,
        repeatRefresh: true,
        ease: "sine.inOut",
      }),
      gsap.to(innerFlame, {
        scaleX: () => gsap.utils.random(0.94, 1.025),
        scaleY: () => gsap.utils.random(0.98, 1.09),
        opacity: () => gsap.utils.random(0.8, 0.96),
        duration: 0.14,
        repeat: -1,
        repeatRefresh: true,
        ease: "sine.inOut",
      }),
      gsap.to(glow, {
        scale: 1.04,
        opacity: 0.7,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      }),
    );
  }

  if (finePointer && !reducedMotion) {
    const moveX = gsap.quickTo(rocketDepth, "x", { duration: 0.8, ease: "power3.out" });
    const moveY = gsap.quickTo(rocketDepth, "y", { duration: 0.8, ease: "power3.out" });
    const rotateX = gsap.quickTo(rocketDepth, "rotationX", { duration: 0.8, ease: "power3.out" });
    const rotateY = gsap.quickTo(rocketDepth, "rotationY", { duration: 0.8, ease: "power3.out" });
    const glintX = glint ? gsap.quickTo(glint, "x", { duration: 0.65, ease: "power3.out" }) : null;
    const glintY = glint ? gsap.quickTo(glint, "y", { duration: 0.65, ease: "power3.out" }) : null;
    const gridX = grid ? gsap.quickTo(grid, "x", { duration: 1.1, ease: "power3.out" }) : null;
    const gridY = grid ? gsap.quickTo(grid, "y", { duration: 1.1, ease: "power3.out" }) : null;
    const backgroundX = gsap.quickTo(lab, "--mx", { duration: 0.9, ease: "power3.out" });
    const backgroundY = gsap.quickTo(lab, "--my", { duration: 0.9, ease: "power3.out" });
    const shadowX = gsap.quickTo(rocketDepth, "--rocket-shadow-x", { duration: 0.8, ease: "power3.out" });

    const resetParallax = () => {
      moveX(0);
      moveY(0);
      rotateX(0);
      rotateY(0);
      glintX?.(0);
      glintY?.(0);
      gridX?.(0);
      gridY?.(0);
      backgroundX(0);
      backgroundY(0);
      shadowX("0px");
    };

    lab.addEventListener("pointermove", (event) => {
      if (launching) return;
      const rect = lab.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      moveX(x * 8);
      moveY(y * 5);
      rotateX(y * -4);
      rotateY(x * 6);
      glintX?.(x * 2.4);
      glintY?.(y * 1.8);
      gridX?.(x * -3);
      gridY?.(y * -2);
      backgroundX(x);
      backgroundY(y);
      shadowX(`${(-x * 5).toFixed(2)}px`);
    }, { passive: true });

    lab.addEventListener("pointerleave", resetParallax);
    lab.addEventListener("pointerenter", () => {
      if (launching) return;
      gsap.to(rocket, { scale: 1.012, duration: 0.45, ease: "power3.out" });
      gsap.to(glow, { opacity: 0.78, duration: 0.45, ease: "power3.out" });
    });
    lab.addEventListener("pointerleave", () => {
      gsap.to(rocket, { scale: 1, duration: 0.55, ease: "power3.out" });
      gsap.to(glow, { opacity: 0.62, duration: 0.55, ease: "power3.out" });
    });
  }

  if (canUseScrollTrigger) {
    gsap.to(rocketScroll, {
      y: compactLayout ? -58 : -132,
      scale: compactLayout ? 0.93 : 0.84,
      rotationZ: compactLayout ? 0 : -4,
      opacity: compactLayout ? 0.22 : 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom 40%",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  const setAmbientPaused = (paused) => {
    ambientAnimations.forEach((animation) => animation.paused(paused));
  };

  const restartAmbient = () => {
    ambientAnimations.forEach((animation) => animation.invalidate().restart());
  };

  const emitLaunch = () => {
    const rect = lab.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent("rocket:launch", {
      detail: {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height * 0.45,
      },
    }));
  };

  const finishLaunch = () => {
    launching = false;
    lab.classList.remove("is-launching");
    if (launchControl) launchControl.disabled = false;
    if (launchLabel) launchLabel.textContent = "LANÇAR NOVAMENTE";
    pinFlamesToNozzle();
    resetExhaust();
    restartAmbient();
  };

  launchControl?.addEventListener("click", () => {
    if (launching) return;
    launching = true;
    launchControl.disabled = true;
    lab.classList.add("is-launching");
    setAmbientPaused(true);
    pinFlamesToNozzle();
    resetExhaust();
    emitLaunch();

    if (reducedMotion) {
      gsap.timeline({ onComplete: finishLaunch })
        .to([outerFlame, innerFlame], { scaleY: 1.08, duration: 0.16 })
        .to(glow, { opacity: 0.74, duration: 0.16 }, "<")
        .to(rocketFlight, { y: -8, duration: 0.22, ease: "sine.out" })
        .to(rocketFlight, { y: 0, duration: 0.28, ease: "sine.inOut" })
        .set([outerFlame, innerFlame], { clearProps: "transform" })
        .set(glow, { clearProps: "opacity" });
      return;
    }

    const exitDistance = Math.max(460, lab.clientHeight * 1.25);
    gsap.timeline({ onComplete: finishLaunch })
      .to(outerFlame, { scaleX: 1.1, scaleY: 1.3, opacity: 1, duration: 0.2, ease: "power2.out" })
      .to(innerFlame, { scaleX: 1, scaleY: 1.18, opacity: 1, duration: 0.18, ease: "power2.out" }, "<.02")
      .to(glow, { scale: 1.24, opacity: 0.9, duration: 0.22, ease: "power2.out" }, "<")
      .to(exhaust, { scaleX: 0.78, scaleY: 0.72, opacity: 0.34, duration: 0.2, ease: "power2.out" }, "<")
      .to(rocketFlight, { x: 2.5, duration: 0.045, repeat: 5, yoyo: true, ease: "none" })
      .add(pinFlamesToNozzle)
      .addLabel("liftoff")
      .to(exhaust, { scaleX: 0.9, scaleY: 1.55, opacity: 0.82, duration: 0.2, ease: "power2.in" }, "liftoff")
      .to(rocketFlight, { x: 0, y: -exitDistance, scale: 0.94, opacity: 0, duration: 1.02, ease: "power4.in" }, "liftoff")
      .to(exhaust, { scaleY: 1.36, opacity: 0.6, duration: 0.065, repeat: 7, yoyo: true, ease: "sine.inOut" }, "liftoff+=.2")
      .to([outerFlame, innerFlame], { opacity: 0.78, duration: 0.055, repeat: 7, yoyo: true, ease: "sine.inOut" }, "liftoff")
      .set(rocketFlight, { y: lab.clientHeight * 0.35, scale: 1.04, opacity: 0 })
      .add(resetExhaust)
      .set(glow, { clearProps: "transform,opacity" })
      .to(rocketFlight, { y: 0, scale: 1, opacity: 1, duration: 0.72, ease: "power3.out" }, "+=.45");
  });
})();
