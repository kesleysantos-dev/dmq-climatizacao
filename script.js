(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  document.body.classList.add("is-loading");
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Split do título da hero ---------- */
  const splitWords = (root) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(" ");
            const w = document.createElement("span");
            w.className = "word";
            const inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--i", i++);
            w.append(inner);
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(root);
  };
  $$("[data-split]").forEach(splitWords);

  /* ---------- Preloader ---------- */
  const preloader = $(".preloader");
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    preloader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
    setTimeout(runThermostat, 900);
  };
  window.addEventListener("load", () => setTimeout(start, 350));
  setTimeout(start, 3500); // não deixa o usuário preso se o vídeo demorar

  /* ---------- Vídeo da hero: loop infinito de 15s ---------- */
  const video = $(".hero__video");
  if (video) {
    const loopAt = parseFloat(video.dataset.loopSeconds) || 15;
    video.muted = true;
    video.loop = true; // cobre vídeos com menos de 15s
    video.addEventListener("timeupdate", () => {
      if (video.currentTime >= loopAt) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    });
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    document.addEventListener("visibilitychange", () => (document.hidden ? video.pause() : tryPlay()));
    if (reduceMotion) video.pause();
  }

  /* ---------- Termostato decorativo ---------- */
  function runThermostat() {
    const card = $(".hero__thermo");
    const out = $("[data-temp]");
    const ring = $(".thermo__ring .fill");
    if (!card || !out || !ring) return;
    const from = 30, to = 18, dur = reduceMotion ? 1 : 2600, len = 327;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      out.textContent = Math.round(from - (from - to) * e);
      ring.style.strokeDashoffset = len - len * (0.15 + 0.7 * e);
      if (p < 1) requestAnimationFrame(tick);
      else card.classList.add("is-cool");
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Partículas de ar frio ---------- */
  const canvas = $(".hero__air");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, parts = [], running = true;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, (w * h) / 22000));
      parts = Array.from({ length: count }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: anywhere ? Math.random() * w : -20,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vx: Math.random() * 0.5 + 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.5 + 0.15,
      ph: Math.random() * Math.PI * 2,
    });
    const draw = (t) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy + Math.sin(t / 1400 + p.ph) * 0.15;
        if (p.x > w + 20) Object.assign(p, spawn(false));
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 222, 255, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(draw);
    }).observe(canvas);
    requestAnimationFrame(draw);
  }

  /* ---------- Navbar ---------- */
  const nav = $("#nav");
  const waFloat = $(".wa-float");
  const hero = $(".hero");
  let lastY = window.scrollY;

  /* ---------- Menu mobile ---------- */
  const toggle = $(".nav__toggle");
  const menu = $("#mobile-menu");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.setAttribute("aria-hidden", !open);
  };
  toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- Link ativo ---------- */
  const navLinks = $$(".nav__links a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const activeIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => activeIO.observe(s));

  /* ---------- Reveal ao rolar ---------- */
  const revealEls = $$("[data-reveal]");
  // escalonamento automático entre irmãos
  const groups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    const idx = groups.get(parent) || 0;
    el.style.setProperty("--d", `${Math.min(idx, 6) * 0.09}s`);
    groups.set(parent, idx + 1);
  });
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Parallax + progresso (um único rAF) ---------- */
  const heroMedia = $("[data-parallax-hero]");
  const heroContent = $(".hero__content");
  const parallaxEls = $$("[data-parallax]");
  const parallaxImgs = $$("[data-parallax-img]");
  const steps = $$(".step");
  const stepsWrap = $(".steps");
  const stepsLine = $(".steps__line i");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > vh * 0.9 && !document.body.classList.contains("menu-open"));
    lastY = y;
    waFloat.classList.toggle("is-visible", y > hero.offsetHeight * 0.6);

    if (!reduceMotion) {
      if (y < vh * 1.2) {
        heroMedia.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
        heroContent.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        heroContent.style.opacity = String(Math.max(0, 1 - y / (vh * 0.75)));
      }
      parallaxEls.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - vh / 2) * speed}px, 0)`;
      });
      parallaxImgs.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0, ${p * -40}px, 0)`;
      });
    }

    if (stepsWrap) {
      const r = stepsWrap.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
      if (stepsLine) stepsLine.parentElement.style.setProperty("--progress", p.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle("is-lit", p >= (i / steps.length) + 0.02 || (reduceMotion && r.top < vh)));
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Tilt + spotlight nos cards ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        if (card.classList.contains("is-in"))
          card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg) translateY(-6px)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });

    /* ---------- Botões magnéticos ---------- */
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- Accordion suave (um aberto por vez) ---------- */
  const details = $$(".accordion details");
  details.forEach((d) => {
    const summary = $("summary", d);
    const body = $(".accordion__body", d);
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      const opening = !d.open;
      details.forEach((o) => o !== d && o.open && animateClose(o));
      opening ? animateOpen(d, body) : animateClose(d);
    });
  });
  function animateOpen(d, body) {
    d.open = true;
    if (reduceMotion) return;
    const h = body.scrollHeight;
    body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" });
  }
  function animateClose(d) {
    const body = $(".accordion__body", d);
    if (reduceMotion) return (d.open = false);
    const a = body.animate([{ height: body.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 350, easing: "cubic-bezier(.65,0,.35,1)" });
    a.onfinish = () => (d.open = false);
  }
})();
