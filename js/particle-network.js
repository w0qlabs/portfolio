(() => {
  const section = document.querySelector("[data-particle-section]");
  const canvas = document.querySelector("[data-particle-network]");
  const glow = document.querySelector("[data-particle-glow]");
  if (!section || !canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const particles = [];
  const pointer = { x: 0, y: 0, active: false };
  const launchBurst = { x: 0, y: 0, strength: 0 };
  const bounds = { width: 0, height: 0, dpr: 1 };
  const settings = {
    count: 0,
    connectionDistance: 128,
    mouseRadius: 285,
    friction: 0.92,
    homeForce: 0.0022,
    drift: 0.012,
    maxSpeed: 0.78,
  };

  let animationFrame = 0;
  let visible = true;
  let lastTime = performance.now();

  const random = (min, max) => min + Math.random() * (max - min);

  const getParticleCount = () => {
    const area = bounds.width * bounds.height;
    if (bounds.width <= 620) return Math.round(Math.min(35, Math.max(22, area / 15500)));
    if (bounds.width <= 900) return Math.round(Math.min(64, Math.max(45, area / 12500)));
    return Math.round(Math.min(96, Math.max(70, area / 11500)));
  };

  const setParticleHome = (particle) => {
    particle.homeX = random(bounds.width * 0.04, bounds.width * 0.96);
    particle.homeY = random(bounds.height * 0.08, bounds.height * 0.92);
    particle.x = particle.homeX + random(-16, 16);
    particle.y = particle.homeY + random(-16, 16);
    particle.vx = random(-0.08, 0.08);
    particle.vy = random(-0.08, 0.08);
    particle.phase = random(0, Math.PI * 2);
    particle.size = random(0.75, 1.55);
  };

  const syncParticles = () => {
    settings.count = getParticleCount();
    settings.connectionDistance = bounds.width <= 620 ? 108 : bounds.width <= 900 ? 118 : 138;
    settings.mouseRadius = bounds.width <= 900 ? 230 : 305;

    while (particles.length < settings.count) {
      const particle = {};
      setParticleHome(particle);
      particles.push(particle);
    }
    particles.length = settings.count;

    particles.forEach((particle) => {
      particle.homeX = Math.min(bounds.width * 0.96, Math.max(bounds.width * 0.04, particle.homeX));
      particle.homeY = Math.min(bounds.height * 0.92, Math.max(bounds.height * 0.08, particle.homeY));
      particle.x = Math.min(bounds.width, Math.max(0, particle.x));
      particle.y = Math.min(bounds.height, Math.max(0, particle.y));
    });
  };

  const resize = () => {
    const rect = section.getBoundingClientRect();
    bounds.width = Math.max(1, rect.width);
    bounds.height = Math.max(1, rect.height);
    bounds.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(bounds.width * bounds.dpr);
    canvas.height = Math.round(bounds.height * bounds.dpr);
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    context.setTransform(bounds.dpr, 0, 0, bounds.dpr, 0, 0);
    syncParticles();
    draw(performance.now(), true);
  };

  const updatePointer = (event) => {
    if (!finePointer || reducedMotion) return;
    const rect = section.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = pointer.x >= 0 && pointer.x <= rect.width && pointer.y >= 0 && pointer.y <= rect.height;

    if (glow) {
      glow.style.setProperty("--cursor-x", `${pointer.x}px`);
      glow.style.setProperty("--cursor-y", `${pointer.y}px`);
      glow.classList.toggle("is-visible", pointer.active);
    }
  };

  const clearPointer = () => {
    pointer.active = false;
    glow?.classList.remove("is-visible");
  };

  const update = (time, staticFrame = false) => {
    const delta = Math.min(32, time - lastTime) / 16.67;
    lastTime = time;

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const driftX = Math.cos(time * 0.00022 + particle.phase) * settings.drift;
      const driftY = Math.sin(time * 0.00018 + particle.phase * 1.37) * settings.drift;

      if (!reducedMotion && !staticFrame) {
        particle.vx += (particle.homeX - particle.x) * settings.homeForce + driftX;
        particle.vy += (particle.homeY - particle.y) * settings.homeForce + driftY;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          const radiusSquared = settings.mouseRadius * settings.mouseRadius;

          if (distanceSquared > 0.001 && distanceSquared < radiusSquared) {
            const distance = Math.sqrt(distanceSquared);
            const force = (1 - distance / settings.mouseRadius) * 0.22;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        if (launchBurst.strength > 0.002) {
          const burstX = particle.x - launchBurst.x;
          const burstY = particle.y - launchBurst.y;
          const burstDistance = Math.max(18, Math.sqrt(burstX * burstX + burstY * burstY));
          const burstForce = Math.min(0.42, (launchBurst.strength * 95) / burstDistance);
          particle.vx += (burstX / burstDistance) * burstForce;
          particle.vy += (burstY / burstDistance) * burstForce;
        }

        particle.vx *= settings.friction;
        particle.vy *= settings.friction;

        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > settings.maxSpeed) {
          particle.vx = (particle.vx / speed) * settings.maxSpeed;
          particle.vy = (particle.vy / speed) * settings.maxSpeed;
        }

        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
      }
    }

    launchBurst.strength *= 0.91;
  };

  const draw = (time, staticFrame = false) => {
    update(time, staticFrame);
    context.clearRect(0, 0, bounds.width, bounds.height);

    for (let i = 0; i < particles.length; i += 1) {
      const first = particles[i];

      for (let j = i + 1; j < particles.length; j += 1) {
        const second = particles[j];
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < settings.connectionDistance) {
          const strength = 1 - distance / settings.connectionDistance;
          const nearCursor = pointer.active && (Math.abs((first.x + second.x) * 0.5 - pointer.x) + Math.abs((first.y + second.y) * 0.5 - pointer.y)) < settings.mouseRadius;
          const alpha = (nearCursor ? 0.085 : 0.052) * strength;
          context.strokeStyle = nearCursor ? `rgba(255, 36, 56, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }
    }

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const pulse = reducedMotion ? 0 : Math.sin(time * 0.001 + particle.phase) * 0.24;
      context.fillStyle = "rgba(255, 255, 255, 0.18)";
      context.beginPath();
      context.arc(particle.x, particle.y, Math.max(0.55, particle.size + pulse), 0, Math.PI * 2);
      context.fill();
    }
  };

  const animate = (time) => {
    animationFrame = 0;
    if (!visible || document.hidden) return;
    draw(time);
    if (!reducedMotion) animationFrame = requestAnimationFrame(animate);
  };

  const start = () => {
    if (animationFrame || !visible || document.hidden) return;
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(animate);
  };

  const stop = () => {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  }, { threshold: 0.02 });

  window.addEventListener("resize", resize, { passive: true });
  section.addEventListener("pointermove", updatePointer, { passive: true });
  section.addEventListener("pointerleave", clearPointer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("rocket:launch", (event) => {
    if (reducedMotion) return;
    const rect = section.getBoundingClientRect();
    launchBurst.x = event.detail.clientX - rect.left;
    launchBurst.y = event.detail.clientY - rect.top;
    launchBurst.strength = 1;
  });

  observer.observe(section);
  resize();
  if (reducedMotion) draw(performance.now(), true);
  else start();
})();
