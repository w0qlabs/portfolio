(() => {
  const lab = document.querySelector("[data-rocket-system]");
  if (!lab) return;
  lab.rocketController?.destroy();

  const gsap = window.gsap;
  const $ = (selector) => lab.querySelector(selector);
  const wrap = $(".rocket-wrap");
  const scroll = $(".rocket-scroll");
  const flight = $(".rocket-flight");
  const depth = $(".rocket-depth");
  const floating = $(".rocket-float");
  const rocket = $(".rocket");
  const head = $(".mascot-head");
  const arm = $(".mascot-arm");
  const face = $(".mascot-surprised");
  const exhaust = $(".rocket-exhaust");
  const flame = $(".rocket-flame");
  const core = $(".rocket-hot-core");
  const glow = $(".rocket-glow");
  const sparks = [...lab.querySelectorAll(".rocket-sparks circle")];
  const smokeLayer = $(".rocket-smoke");
  const smoke = [...lab.querySelectorAll(".rocket-smoke span")];
  const button = $("[data-launch-rocket]");
  const label = $("[data-launch-label]");
  const status = $("[data-rocket-status]");

  if (!gsap || !rocket || !button) {
    if (button) button.disabled = true;
    return;
  }
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  const media = gsap.matchMedia();
  let launch = () => {};
  let reset = () => {};
  let isLaunching = false;
  const setState = (launching) => {
    isLaunching = launching;
    lab.classList.toggle("is-launching", launching);
    lab.dataset.rocketState = launching ? "launching" : "idle";
    button.disabled = launching;
    button.setAttribute("aria-busy", String(launching));
    label.textContent = launching ? "LANÇANDO..." : "LANÇAR FOGUETE";
  };

  media.add({
    desktop: "(min-width: 901px)",
    mobile: "(max-width: 620px)",
    fine: "(hover: hover) and (pointer: fine)",
    reduced: "(prefers-reduced-motion: reduce)",
    all: "all",
  }, (context) => {
    const { desktop, mobile, fine, reduced } = context.conditions;
    const motion = mobile ? 0.5 : desktop ? 1 : 0.72;
    const smokeCount = mobile ? 4 : desktop ? 8 : 6;
    const sparkCount = mobile ? 3 : desktop ? 6 : 4;
    const ambient = [];
    let inView = true;
    let exitX = 800;
    let launchTimeline;
    let scrollTween;

    gsap.set([flight, depth, floating], { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, transformOrigin: "53% 49%" });
    gsap.set(head, { svgOrigin: "851 312", rotation: 0, y: 0 });
    gsap.set(arm, { svgOrigin: "981 303", rotation: 0 });
    // Leave the first 135 units fixed to the nozzle. Stretch the overlapping tail about its join.
    // A pivot at the nozzle alone cannot hold the cut edge of a raster flame in place.
    gsap.set([exhaust, flame], { svgOrigin: "0 120", scale: 1, rotation: 0 });
    gsap.set(core, { svgOrigin: "0 0", scale: 1, opacity: 0.64 });
    gsap.set(glow, { svgOrigin: "772 669", scale: 1, opacity: 0.5 });
    gsap.set(face, { opacity: 0 });
    gsap.set([...smoke, ...sparks], { opacity: 0 });
    setState(false);

    const pauseAmbient = () => ambient.forEach((animation) => animation.pause());
    const resumeAmbient = () => {
      if (!isLaunching && inView && !document.hidden) {
        ambient.forEach((animation) => animation.resume());
      }
    };
    const restartAmbient = () => {
      ambient.forEach((animation) => animation.invalidate().restart());
      if (document.hidden || !inView) pauseAmbient();
    };

    if (!reduced) {
      // Different periods keep the quiet floating, breathing and rider motion from marching together.
      const idleTimeline = gsap.timeline({ id: "rocket-idle", repeat: -1, defaults: { ease: "sine.inOut" } })
        .to(floating, { x: 5 * motion, y: -10 * motion, rotation: 1.1 * motion, duration: 3.2 })
        .to(floating, { x: -3 * motion, y: -6 * motion, rotation: -0.8 * motion, duration: 2.7 })
        .to(floating, { x: -5 * motion, y: 3 * motion, rotation: -0.3 * motion, duration: 3.6 })
        .to(floating, { x: 0, y: 0, rotation: 0, duration: 3.1 });
      ambient.push(idleTimeline,
        gsap.to(rocket, { scale: 1.004, duration: 4.3, repeat: -1, yoyo: true, ease: "sine.inOut" }),
        gsap.to(head, { rotation: -0.55 * motion, y: 1.8 * motion, duration: 2.3, repeat: -1, yoyo: true, ease: "sine.inOut" }),
        gsap.to(arm, { rotation: -0.65 * motion, duration: 3.7, repeat: -1, yoyo: true, ease: "sine.inOut" }),
        gsap.to(flame, {
          scaleY: () => gsap.utils.random(0.9, 1.1),
          duration: 0.13, repeat: -1, repeatRefresh: true, ease: "sine.inOut",
        }),
        gsap.to(core, {
          scaleX: () => gsap.utils.random(0.82, 1.07),
          scaleY: () => gsap.utils.random(0.78, 1.22),
          opacity: () => gsap.utils.random(0.55, 0.86),
          duration: 0.09, repeat: -1, repeatRefresh: true, ease: "sine.inOut",
        }),
        gsap.to(glow, { scale: 1.08, opacity: 0.64, duration: 1.9, repeat: -1, yoyo: true, ease: "sine.inOut" }),
        gsap.timeline({ repeat: -1, repeatDelay: 8.1, delay: 5.6 })
          .to(rocket, { x: 0.4 * motion, duration: 0.06, repeat: 3, yoyo: true, ease: "none" })
          .to(rocket, { x: 0, duration: 0.12 }),
      );

      sparks.slice(0, mobile ? 1 : 3).forEach((spark, index) => {
        ambient.push(gsap.fromTo(spark, { x: 0, y: 70, scale: 0.7, opacity: 0.5 }, {
          x: () => gsap.utils.random(-35, 35), y: () => gsap.utils.random(210, 310),
          scale: 0.15, opacity: 0, duration: 0.85 + index * 0.19,
          delay: index * 0.48, repeat: -1, repeatDelay: 0.5, repeatRefresh: true, ease: "power1.out",
        }));
      });
    }

    // Scroll owns its own wrapper. Mobile keeps the mascot visible when the button enters view.
    if (desktop && !reduced && window.ScrollTrigger) {
      scrollTween = gsap.to(scroll, {
        y: -55, scale: 0.96, opacity: 0.3, ease: "none",
        scrollTrigger: {
          id: "rocket-scroll", trigger: lab, start: "top 10%", end: "bottom top",
          scrub: 0.8, invalidateOnRefresh: true,
        },
      });
    }

    const parallax = fine && !mobile && !reduced ? [
      gsap.quickTo(depth, "x", { duration: 0.8, ease: "power3.out" }),
      gsap.quickTo(depth, "y", { duration: 0.8, ease: "power3.out" }),
      gsap.quickTo(depth, "rotation", { duration: 0.9, ease: "power3.out" }),
    ] : [];
    const onPointerMove = (event) => {
      if (isLaunching || !parallax.length) return;
      const rect = lab.getBoundingClientRect();
      const x = gsap.utils.clamp(-1, 1, (event.clientX - rect.left) / rect.width * 2 - 1);
      const y = gsap.utils.clamp(-1, 1, (event.clientY - rect.top) / rect.height * 2 - 1);
      parallax[0](x * 6);
      parallax[1](y * 4);
      parallax[2](x * 0.65);
    };
    const onPointerLeave = () => {
      if (!isLaunching) parallax.forEach((move) => move(0));
    };
    lab.addEventListener("pointermove", onPointerMove, { passive: true });
    lab.addEventListener("pointerleave", onPointerLeave);

    const finishLaunch = () => {
      setState(false);
      status.textContent = "Foguete de volta. Pronto para lançar novamente.";
      scrollTween?.scrollTrigger.enable(false);
      restartAmbient();
    };

    launchTimeline = gsap.timeline({
      id: "rocket-launch", paused: true, onComplete: finishLaunch,
      defaults: { ease: "power2.out" },
    });

    if (reduced) {
      launchTimeline
        .set(face, { opacity: 1 })
        .to(flight, { opacity: 0.35, duration: 0.16 })
        .set(face, { opacity: 0 })
        .to(flight, { opacity: 1, duration: 0.22 }, "+=0.08");
    } else {
      launchTimeline
        .addLabel("anticipation", 0)
        .to(floating, { x: 0, y: 0, rotation: 0, duration: 0.24 }, 0)
        .to(depth, { x: 0, y: 0, rotation: 0, duration: 0.24 }, 0)
        .to(rocket, { x: 0, scale: 1, duration: 0.24 }, 0)
        .to(flight, { x: -4 * motion, y: 6 * motion, scaleY: 0.985, rotation: 1.2, duration: 0.26, ease: "power2.inOut" }, 0)
        .to(exhaust, { scaleY: 0.65, duration: 0.2 }, 0)
        .to(core, { scaleY: 0.6, opacity: 0.3, duration: 0.2 }, 0)
        .set(face, { opacity: 1 }, 0.18)
        .to(head, { rotation: -1.8 * motion, y: 2.5, duration: 0.2 }, 0.18)
        .to(arm, { rotation: 1.4 * motion, duration: 0.22 }, 0.18)
        .addLabel("ignition", 0.3)
        .call(() => {
          status.textContent = "Decolando!";
          const origin = smokeLayer.getBoundingClientRect();
          window.dispatchEvent(new CustomEvent("rocket:launch", {
            detail: { clientX: origin.left, clientY: origin.top },
          }));
        }, [], "ignition")
        .to(exhaust, { scaleY: mobile ? 2 : 2.6, duration: 0.18, ease: "power3.out" }, "ignition")
        .to(core, { scaleY: 3.2, scaleX: 1.2, opacity: 1, duration: 0.16 }, "ignition")
        .to(glow, { scale: 1.7, opacity: 0.95, duration: 0.16 }, "ignition")
        .to(rocket, { x: 1.1 * motion, duration: 0.045, repeat: 5, yoyo: true, ease: "none" }, "ignition")
        .to(flame, { scaleY: 0.94, duration: 0.055, repeat: 13, yoyo: true, ease: "none" }, "ignition")
        .addLabel("takeoff", 0.64)
        .to(flight, {
          x: () => exitX, y: () => -exitX * 1.1, rotation: -7,
          scale: 0.96, duration: 1.06, ease: "power3.in",
        }, "takeoff")
        .to(head, { rotation: -3.2 * motion, y: 3, duration: 0.24 }, "takeoff")
        .to(arm, { rotation: 2.1 * motion, duration: 0.2 }, "takeoff")
        .to(exhaust, { scaleY: mobile ? 2.3 : 3.1, duration: 0.4, ease: "power2.in" }, "takeoff");

      smoke.slice(0, smokeCount).forEach((puff, index) => {
        const angle = (110 + index * 21) * Math.PI / 180;
        const distance = (34 + index * 10) * motion;
        launchTimeline.fromTo(puff, {
          x: -15, y: -12, scale: 0.3, rotation: 0, opacity: 0,
        }, {
          x: Math.cos(angle) * distance - 15, y: Math.sin(angle) * distance + 8,
          scale: 1.2 + index * 0.13, rotation: index % 2 ? 32 : -27,
          duration: mobile ? 0.5 : 0.78, ease: "power2.out", immediateRender: false,
        }, "ignition+=" + index * 0.025)
          .to(puff, { opacity: 0.42, duration: 0.09 }, "ignition+=" + index * 0.025)
          .to(puff, { opacity: 0, duration: mobile ? 0.26 : 0.45 }, "ignition+=" + (0.22 + index * 0.025));
      });
      sparks.slice(0, sparkCount).forEach((spark, index) => {
        launchTimeline.fromTo(spark, { x: 0, y: 30, scale: 1.3, opacity: 0.9 }, {
          x: (index % 2 ? -1 : 1) * (25 + index * 11), y: 330 + index * 22,
          scale: 0.2, opacity: 0, duration: 0.58, ease: "power2.out", immediateRender: false,
        }, "ignition+=" + index * 0.035);
      });

      launchTimeline
        .addLabel("offscreen", 1.7)
        .set(flight, { opacity: 0 }, "offscreen")
        .set([...smoke, ...sparks], { opacity: 0 }, "offscreen")
        .set(flight, { x: -16 * motion, y: 12 * motion, rotation: 1, scale: 1 }, "offscreen+=0.16")
        .set([head, arm], { rotation: 0, y: 0 }, "offscreen+=0.16")
        .set([exhaust, flame], { scale: 1, rotation: 0 }, "offscreen+=0.16")
        .set(core, { scale: 1, opacity: 0.64 }, "offscreen+=0.16")
        .set(glow, { scale: 1, opacity: 0.5 }, "offscreen+=0.16")
        .set(rocket, { x: 0, scale: 1 }, "offscreen+=0.16")
        .set(face, { opacity: 0 }, "offscreen+=0.16")
        .addLabel("return", 2.16)
        .to(flight, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.72, ease: "power2.out" }, "return");
    }

    launch = () => {
      if (isLaunching || document.hidden) return;
      // Capture geometry before writes; smoke stays at ignition while the mascot leaves.
      const labRect = lab.getBoundingClientRect();
      const point = rocket.createSVGPoint();
      point.x = 772;
      point.y = 669;
      const matrix = rocket.getScreenCTM();
      const origin = matrix ? point.matrixTransform(matrix) : { x: labRect.left + labRect.width * 0.4, y: labRect.top + labRect.height * 0.65 };
      exitX = Math.max(window.innerWidth - labRect.left + wrap.clientWidth, (labRect.top + labRect.height) / 1.1);
      smokeLayer.style.transform = "translate(" + (origin.x - labRect.left) + "px," + (origin.y - labRect.top) + "px)";
      pauseAmbient();
      parallax.forEach((move) => move.tween.pause());
      scrollTween?.scrollTrigger.getTween()?.pause();
      scrollTween?.scrollTrigger.disable(false);
      setState(true);
      status.textContent = "Preparando lançamento.";
      launchTimeline.invalidate().restart();
    };

    reset = () => {
      launchTimeline.pause(0, true);
      gsap.set([flight, depth, floating], { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 });
      gsap.set([head, arm], { rotation: 0, y: 0 });
      gsap.set([exhaust, flame, core, glow], { scale: 1, rotation: 0 });
      gsap.set(core, { opacity: 0.64 });
      gsap.set(glow, { opacity: 0.5 });
      gsap.set(face, { opacity: 0 });
      gsap.set([...smoke, ...sparks], { opacity: 0 });
      finishLaunch();
    };

    const onVisibility = () => {
      if (document.hidden) {
        pauseAmbient();
        if (isLaunching) launchTimeline.pause();
      } else if (isLaunching) {
        launchTimeline.resume();
      } else {
        resumeAmbient();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) pauseAmbient();
      else resumeAmbient();
    }, { rootMargin: "60px" });
    observer.observe(lab);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      lab.removeEventListener("pointermove", onPointerMove);
      lab.removeEventListener("pointerleave", onPointerLeave);
      smokeLayer.style.removeProperty("transform");
      setState(false);
      status.textContent = "";
    };
  }, lab);

  const onClick = () => launch();
  const onPageHide = (event) => {
    if (!event.persisted) lab.rocketController?.destroy();
  };
  button.addEventListener("click", onClick);
  window.addEventListener("pagehide", onPageHide);
  lab.rocketController = {
    launch: () => launch(),
    reset: () => reset(),
    get isLaunching() { return isLaunching; },
    destroy() {
      media.revert();
      button.removeEventListener("click", onClick);
      window.removeEventListener("pagehide", onPageHide);
      delete lab.rocketController;
    },
  };
})();
