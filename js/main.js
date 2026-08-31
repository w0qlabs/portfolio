(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress span");
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");

  const updateScrollState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.transform = `scaleX(${value})`;
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState, { passive: true });

  const closeMenu = () => {
    nav?.classList.remove("is-open");
    navToggle?.classList.remove("is-active");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-open");
  };

  navToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    if (open && nav) nav.scrollTop = 0;
    navToggle.classList.toggle("is-active", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", open);
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  }, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  if (finePointer && !reducedMotion) {
    const dot = document.querySelector(".cursor-dot");
    const orbit = document.querySelector(".cursor-orbit");
    const cursorLabel = orbit?.querySelector("span");
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const follower = { x: pointer.x, y: pointer.y };

    document.documentElement.classList.add("cursor-ready");

    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (dot) dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    }, { passive: true });

    const renderCursor = () => {
      follower.x += (pointer.x - follower.x) * 0.15;
      follower.y += (pointer.y - follower.y) * 0.15;
      if (orbit) orbit.style.transform = `translate3d(${follower.x}px, ${follower.y}px, 0)`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();

    const cursorLabels = { view: "VER", project: "PROJETO", cta: "ABRIR", link: "IR", github: "GITHUB" };
    document.querySelectorAll("[data-cursor]").forEach((element) => {
      element.addEventListener("pointerenter", () => {
        const type = element.dataset.cursor;
        orbit?.classList.add("is-active");
        orbit?.classList.toggle("is-cta", type === "cta");
        if (cursorLabel) cursorLabel.textContent = cursorLabels[type] || "VER";
      });
      element.addEventListener("pointerleave", () => {
        orbit?.classList.remove("is-active", "is-cta");
        if (cursorLabel) cursorLabel.textContent = "";
      });
    });

    document.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) document.documentElement.classList.remove("cursor-ready");
    });
    document.addEventListener("mouseover", () => document.documentElement.classList.add("cursor-ready"));

    document.querySelectorAll(".magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - (rect.left + rect.width / 2);
        const y = event.clientY - (rect.top + rect.height / 2);
        element.style.transform = `translate3d(${x * 0.12}px, ${y * 0.12}px, 0)`;
      });
      element.addEventListener("pointerleave", () => {
        element.style.transform = "translate3d(0, 0, 0)";
      });
    });

    document.querySelectorAll(".service-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--card-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--card-y", `${event.clientY - rect.top}px`);
      });
    });

    const lab = document.querySelector("[data-parallax]");
    lab?.addEventListener("pointermove", (event) => {
      const rect = lab.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      lab.style.setProperty("--mx", x.toFixed(3));
      lab.style.setProperty("--my", y.toFixed(3));
    });
    lab?.addEventListener("pointerleave", () => {
      lab.style.setProperty("--mx", "0");
      lab.style.setProperty("--my", "0");
    });
  }

  if (window.gsap && window.ScrollTrigger && !document.hidden && !reducedMotion) {
    gsap.registerPlugin(ScrollTrigger);
    const duration = reducedMotion ? 0.01 : 1;

    const heroTimeline = gsap.timeline({ defaults: { ease: "power4.out", duration } });
    heroTimeline
      .from(".site-header", { y: -30, opacity: 0 })
      .from(".hero-kicker", { y: 14, opacity: 0 }, "-=0.55")
      .from(".hero-line > span", { yPercent: 112, stagger: reducedMotion ? 0 : 0.08 }, "-=0.62")
      .from(".hero-bottom > *", { y: 24, opacity: 0, stagger: reducedMotion ? 0 : 0.1 }, "-=0.6")
      .from(".launch-lab", { x: 45, scale: 0.94, opacity: 0 }, "-=0.85")
      .from(".lab-metric, .lab-label", { opacity: 0, stagger: reducedMotion ? 0 : 0.05 }, "-=0.35");

    if (document.querySelector(".team-hero")) {
      gsap.timeline({ defaults: { ease: "power4.out", duration } })
        .from(".team-hero__copy .kicker", { y: 14, opacity: 0 })
        .from(".team-hero__copy h1", { y: 55, opacity: 0 }, "-=0.65")
        .from(".team-hero__aside > *", { y: 25, opacity: 0, stagger: 0.08 }, "-=0.65")
        .from(".team-hero__orbit", { scale: 0.78, opacity: 0 }, "-=0.9");
    }

    gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
      gsap.from(group.querySelectorAll(".reveal"), {
        y: reducedMotion ? 0 : 44,
        opacity: 0,
        duration,
        stagger: reducedMotion ? 0 : 0.09,
        ease: "power3.out",
        scrollTrigger: { trigger: group, start: "top 82%", once: true },
      });
    });

    gsap.utils.toArray(".reveal").filter((element) => !element.closest("[data-reveal-group]")).forEach((element) => {
      gsap.from(element, {
        y: reducedMotion ? 0 : 46,
        opacity: 0,
        duration,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 84%", once: true },
      });
    });

    if (!reducedMotion) {
      gsap.to(".rocket", {
        yPercent: -14,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      });
      gsap.from(".formula span, .formula strong", {
        scale: 0.72,
        opacity: 0,
        stagger: 0.09,
        duration: 0.7,
        ease: "back.out(1.7)",
        scrollTrigger: { trigger: ".formula", start: "top 80%", once: true },
      });
    }
  }
})();
