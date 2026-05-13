function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas || !canvas.getContext) {
    return { destroy() {} };
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return { destroy() {} };
  }

  const root = document.documentElement;

  function readTokens() {
    const cs = getComputedStyle(root);
    return {
      bgDeep: cs.getPropertyValue('--bg-deep').trim(),
      bgMid: cs.getPropertyValue('--bg-mid').trim(),
      textMuted: cs.getPropertyValue('--text-muted').trim(),
      textPrimary: cs.getPropertyValue('--text-primary').trim(),
      accentStar: cs.getPropertyValue('--accent-star').trim(),
      cosmicCyan: cs.getPropertyValue('--cosmic-cyan').trim(),
      cosmicPurple: cs.getPropertyValue('--cosmic-purple').trim(),
      cosmicRose: cs.getPropertyValue('--cosmic-rose').trim(),
    };
  }

  /** @type {{ x: number; y: number; phase: number; twinkleRate: number }[]} */
  let starsFar = [];
  /** @type {{ x: number; y: number; nx: number; ny: number; glow: boolean; glowHue: string; size: number; twinklePhase: number; twinkleRate: number }[]} */
  let starsNear = [];
  /** @type {{ nx: number; ny: number; r: number; hue: string }[]} */
  let nebulae = [];

  let cssWidth = 0;
  let cssHeight = 0;
  let dprCap = Math.min(window.devicePixelRatio || 1, 2);
  let rafId = 0;
  let scrollY = window.scrollY;
  let prefersReduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reduceMq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function rebuildStars() {
    starsFar = [];
    starsNear = [];
    nebulae = [];

    const w = cssWidth || 1;
    const h = cssHeight || 1;
    const areaFactor = Math.sqrt((w * h) / (1920 * 1080));

    const countFar = Math.round(216 * areaFactor);
    const countNear = Math.round(126 * areaFactor);

    const rand = Math.random;

    for (let i = 0; i < countFar; i++) {
      starsFar.push({
        x: rand() * w,
        y: rand() * h,
        phase: rand() * Math.PI * 2,
        twinkleRate: 0.00072 + rand() * 0.00128,
      });
    }

    for (let i = 0; i < countNear; i++) {
      const rarity = rand();
      const glow = rarity > 0.91;
      const glowHue = rand() > 0.5 ? 'cyan' : 'star';
      starsNear.push({
        x: rand() * w,
        y: rand() * h,
        nx: rand(),
        ny: rand(),
        glow,
        glowHue,
        size: 2 * (1.35 + rand() * 0.65),
        twinklePhase: rand() * Math.PI * 2,
        twinkleRate: 0.00062 + rand() * 0.00115,
      });
    }

    const nebulaCount = 3;
    for (let i = 0; i < nebulaCount; i++) {
      nebulae.push({
        nx: 0.12 + rand() * 0.76,
        ny: 0.08 + rand() * 0.84,
        r: (0.22 + rand() * 0.38) * Math.max(w, h),
        hue: rand() > 0.5 ? 'purple' : 'rose',
      });
    }
  }

  function syncCanvasDimensions() {
    dprCap = Math.min(window.devicePixelRatio || 1, 2);
    cssWidth = window.innerWidth;
    cssHeight = window.innerHeight;

    const bw = Math.max(1, Math.floor(cssWidth * dprCap));
    const bh = Math.max(1, Math.floor(cssHeight * dprCap));

    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }

    ctx.setTransform(dprCap, 0, 0, dprCap, 0, 0);
    rebuildStars();
  }

  function paintFrame(animationTimeMs) {
    const t = readTokens();
    const w = cssWidth;
    const h = cssHeight;

    if (!w || !h) return;

    const g = ctx.createRadialGradient(w * 0.45, h * 0.35, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.72);
    g.addColorStop(0, t.bgMid || t.bgDeep);
    g.addColorStop(1, t.bgDeep);
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < nebulae.length; i++) {
      const nb = nebulae[i];
      const cx = nb.nx * w;
      const cy = nb.ny * h;
      const col = nb.hue === 'purple' ? t.cosmicPurple : t.cosmicRose;
      const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, nb.r);
      ng.addColorStop(0, col);
      ng.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < starsFar.length; i++) {
      const s = starsFar[i];
      const sine = prefersReduce ? 1 : Math.sin(animationTimeMs * s.twinkleRate + s.phase);
      const blink = prefersReduce ? 1 : 0.38 + 0.62 * (0.5 + 0.5 * sine);
      ctx.fillStyle = t.textMuted;
      ctx.globalAlpha = 0.28 * blink;
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    ctx.globalAlpha = 1;
    const parallax = prefersReduce ? 0 : scrollY * 0.028;

    for (let i = 0; i < starsNear.length; i++) {
      const s = starsNear[i];
      const drift = prefersReduce ? 0 : s.ny * 0.006 * Math.sin(animationTimeMs * 0.00055 + s.nx * 6.28);
      const px = (((s.x + parallax * (0.55 + s.nx * 0.45)) % w) + w) % w;
      const py = (((s.y + drift * (h / 540)) % h) + h) % h;

      const sineNear = prefersReduce
        ? 1
        : Math.sin(animationTimeMs * s.twinkleRate + s.twinklePhase);
      const blinkNear = prefersReduce ? 1 : 0.5 + 0.5 * (0.5 + 0.5 * sineNear);

      if (s.glow && !prefersReduce) {
        ctx.save();
        ctx.shadowColor = s.glowHue === 'cyan' ? t.cosmicCyan : t.accentStar;
        ctx.shadowBlur = 5 + blinkNear * 7;
      }

      ctx.fillStyle = t.textPrimary;
      ctx.globalAlpha = blinkNear;
      ctx.fillRect(px, py, s.size, s.size);

      if (s.glow && !prefersReduce) {
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
  }

  function frame(now) {
    paintFrame(now);
    if (!prefersReduce) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function onReduceChange() {
    prefersReduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    cancelAnimationFrame(rafId);
    rafId = 0;

    const now = performance.now();
    paintFrame(now);

    if (!prefersReduce) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function onScrollParallax() {
    scrollY = window.scrollY;
  }

  const resizeObs =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          syncCanvasDimensions();
          paintFrame(performance.now());
        })
      : null;

  function onWinResize() {
    syncCanvasDimensions();
    paintFrame(performance.now());
  }

  if (resizeObs) {
    resizeObs.observe(root);
  }
  window.addEventListener('resize', onWinResize, { passive: true });
  window.addEventListener('scroll', onScrollParallax, { passive: true });

  syncCanvasDimensions();
  const bootNow = performance.now();
  paintFrame(bootNow);
  if (!prefersReduce) {
    rafId = requestAnimationFrame(frame);
  }

  if (reduceMq) {
    if (typeof reduceMq.addEventListener === 'function') {
      reduceMq.addEventListener('change', onReduceChange);
    } else {
      reduceMq.addListener(onReduceChange);
    }
  }

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      rafId = 0;
      resizeObs?.disconnect();
      window.removeEventListener('resize', onWinResize);
      window.removeEventListener('scroll', onScrollParallax);
      if (reduceMq) {
        if (typeof reduceMq.removeEventListener === 'function') {
          reduceMq.removeEventListener('change', onReduceChange);
        } else {
          reduceMq.removeListener(onReduceChange);
        }
      }
    },
  };
}

function initFloatingNav() {
  const nav = document.querySelector('.floating-nav');
  if (!nav) return;

  const links = nav.querySelectorAll('.floating-nav__link[data-section]');
  const sectionOrder = ['hero', 'personagens', 'trailers', 'estreia'];

  function getThreshold() {
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      return heroEl.offsetHeight * 0.6;
    }
    return Math.max(window.innerHeight * 0.6, 300);
  }

  function updateVisibility() {
    const threshold = getThreshold();
    if (window.scrollY > threshold) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }
  }

  function updateActiveFromScroll() {
    const probeY = window.scrollY + window.innerHeight * 0.25;
    let activeId = 'hero';

    for (const id of sectionOrder) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= probeY) {
        activeId = id;
      }
    }

    links.forEach((link) => {
      const sec = link.getAttribute('data-section');
      link.classList.toggle('floating-nav__link--active', sec === activeId);
    });
  }

  function onScrollOrResize() {
    updateVisibility();
    updateActiveFromScroll();
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
  onScrollOrResize();
}

function initMarioScrollAnimation() {
  if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=100%',
      scrub: true
    }
  })

   tl.to('.hero__mario', { y: '100vh', ease: 'none', duration: 1 }, 0)
   .to('.hero__mario', { opacity: 0, ease: 'none', duration: 0.5 }, 0.5)
}

function initYoshiScrollAnimation() {
  if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=100%',
      scrub: true
    }
  })

   tl.to('.hero__yoshi', { y: '100vh', ease: 'none', duration: 1 }, 0)
   .to('.hero__yoshi', { opacity: 0, ease: 'none', duration: 0.5 }, 0.5)
}

function initHeroContentScrollAnimation() {
  if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=100%',
      scrub: true,
      pin: '.hero__content-layer',
      pinSpacing: false
    }
  })

   .to('.hero__content-layer', { opacity: 0, ease: 'none', duration: 0.5 }, 0.5)

   const tl2 = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=100%',
      scrub: true,
      pin: '.hero__scroll-indicator',
      pinSpacing: false
    }
  }) 

   .to('.hero__scroll-indicator', { opacity: 0, ease: 'none', duration: 0.1 }, 0.1)
}

function initPlanetZoomAnimation() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const planet = document.querySelector('.hero__planet');
  if (!planet) return;

  gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=100%',
      scrub: true,
    },
  }  ).fromTo(
    planet,
    {
      xPercent: -50,
      yPercent: 50,
      scale: 1,
      force3D: true,
      transformOrigin: '50% 100%',
    },
    {
      xPercent: -50,
      yPercent: 50,
      scale: 2.5,
      ease: 'none',
      duration: 1,
    },
    0
  );
}