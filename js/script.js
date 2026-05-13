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

function initPersonagensParallax() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const section = document.getElementById('personagens');
  if (!section) return;

  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const parallaxConfigs = [
    {
      selector: '.personagem--mario',
      from: { x: -14, y: -42 },
      to: { x: 22, y: 188 },
      scrub: 0.8,
    },
    {
      selector: '.personagem--luigi',
      from: { x: 18, y: -28 },
      to: { x: -32, y: 210 },
      scrub: 3.3,
    },
    {
      selector: '.personagem--peach',
      from: { x: -8, y: -50 },
      to: { x: 24, y: 164 },
      scrub: 1.05,
    },
    {
      selector: '.personagem--rosalina',
      from: { x: -20, y: -24 },
      to: { x: 36, y: 232 },
      scrub: 1.45,
    },
    {
      selector: '.personagem--yoshi',
      from: { x: 14, y: -38 },
      to: { x: -46, y: 176 },
      scrub: 0.65,
    },
    {
      selector: '.personagem--bowser-jr',
      from: { x: -16, y: -18 },
      to: { x: 30, y: 198 },
      scrub: 1.15,
    },
  ];

  ScrollTrigger.matchMedia({
    '(prefers-reduced-motion: no-preference) and (min-width: 768px)': function () {
      parallaxConfigs.forEach((cfg) => {
        const el = document.querySelector(cfg.selector);
        if (!el) return;

        gsap.fromTo(
          el,
          {
            x: cfg.from.x,
            y: cfg.from.y,
            force3D: true,
          },
          {
            x: cfg.to.x,
            y: cfg.to.y,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: cfg.scrub,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    },
  });
}

/**
 * Fundo particles.js na seção #personagens (cores via tokens --particles-* no :root).
 */
function initPersonagensBg() {
  const section = document.getElementById('personagens');
  const holderId = 'personagens-particles-js';

  if (!section || typeof window.particlesJS !== 'function') {
    return;
  }

  const root = document.documentElement;

  function hexToRgbParticles(hex) {
    if (typeof hex !== 'string' || !hex.trim()) {
      return null;
    }
    const h = hex.trim();
    if (typeof window.hexToRgb === 'function') {
      return window.hexToRgb(h);
    }
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const expanded = h.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expanded);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  function readParticleColorTokens() {
    const cs = getComputedStyle(root);
    return {
      dot: cs.getPropertyValue('--particles-dot').trim(),
      line: cs.getPropertyValue('--particles-line').trim(),
      accent: cs.getPropertyValue('--particles-accent').trim(),
    };
  }

  function applyParticlesColorsFromCss(pJS) {
    const t = readParticleColorTokens();
    const dot = t.dot || '#00f5ff';
    const line = t.line || '#00d9ff';
    const accent = t.accent || '#0096c7';

    pJS.particles.color.value = dot;
    const rgbDot = hexToRgbParticles(dot);
    if (rgbDot) {
      pJS.particles.color.rgb = rgbDot;
    }

    pJS.particles.shape.stroke.color = accent;

    pJS.particles.line_linked.color = line;
    const rgbLine = hexToRgbParticles(line);
    if (rgbLine) {
      pJS.particles.line_linked.color_rgb_line = rgbLine;
    }
  }

  const prefersReduceMq =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  function prefersReducedMotion() {
    return prefersReduceMq ? prefersReduceMq.matches : false;
  }

  if (prefersReducedMotion()) {
    section.classList.add('personagens--particles-reduced');
    return;
  }

  const narrowMq =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 767.98px)')
      : null;

  function isNarrowViewport() {
    return narrowMq ? narrowMq.matches : false;
  }

  function buildParticlesConfig() {
    const t = readParticleColorTokens();
    const mobile = isNarrowViewport();

    return {
      particles: {
        number: {
          value: mobile ? 80 : 140,
          density: { enable: true, value_area: 800 },
        },
        color: { value: t.dot || '#00f5ff' },
        shape: {
          type: 'circle',
          stroke: {
            width: 0.5,
            color: t.accent || '#0096c7',
          },
        },
        opacity: {
          value: 0.7,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.3,
            sync: false,
          },
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: true,
            speed: 2,
            size_min: 1,
            sync: false,
          },
        },
        line_linked: {
          enable: true,
          distance: 160,
          color: t.line || '#00d9ff',
          opacity: 0.4,
          width: 1.2,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'bounce',
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: !mobile, mode: 'push' },
          resize: true,
        },
        modes: {
          grab: {
            distance: 220,
            line_linked: { opacity: 0.8 },
          },
          push: { particles_nb: 4 },
        },
      },
      retina_detect: !mobile,
    };
  }

  window.particlesJS(holderId, buildParticlesConfig());

  const pjsEntry = window.pJSDom && window.pJSDom[window.pJSDom.length - 1];
  const pJS = pjsEntry && pjsEntry.pJS;
  if (!pJS) {
    return;
  }

  applyParticlesColorsFromCss(pJS);

  const cancelRaf =
    window.cancelRequestAnimFrame ||
    window.cancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    clearTimeout;

  let viewportPaused = false;

  function pausePersonagensDraw() {
    if (viewportPaused) return;
    cancelRaf(pJS.fn.drawAnimFrame);
    viewportPaused = true;
  }

  function resumePersonagensDraw() {
    if (!viewportPaused) return;
    viewportPaused = false;
    pJS.fn.vendors.draw();
  }

  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          (entries) => {
            const visible = entries.some((e) => e.isIntersecting);
            if (visible) {
              resumePersonagensDraw();
            } else {
              pausePersonagensDraw();
            }
          },
          { root: null, threshold: 0, rootMargin: '0px' }
        )
      : null;

  if (io) {
    io.observe(section);
  }

  let themeDebounce = 0;
  const themeObserver =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => {
          window.clearTimeout(themeDebounce);
          themeDebounce = window.setTimeout(() => {
            applyParticlesColorsFromCss(pJS);
          }, 50);
        })
      : null;

  if (themeObserver) {
    themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
  }

  if (prefersReduceMq) {
    const onReduce = () => {
      if (prefersReduceMq.matches) {
        pausePersonagensDraw();
      } else {
        resumePersonagensDraw();
      }
    };
    if (typeof prefersReduceMq.addEventListener === 'function') {
      prefersReduceMq.addEventListener('change', onReduce);
    } else {
      prefersReduceMq.addListener(onReduce);
    }
  }
}