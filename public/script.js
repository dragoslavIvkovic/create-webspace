/**
 * Javna inicijalizacija nakon učitavanja ili nakon klijentske navigacije (SPA-lite).
 * Poziva se u DOMContentLoaded, posle zamenjivanog body-ja, i sync ako je DOM već spreman.
 */
function initWebPlacePage() {
  if (window.__NEON_AC) window.__NEON_AC.abort();
  window.__NEON_AC = new AbortController();
  const ac = window.__NEON_AC.signal;

  if (window.__NEON_PRELOADER_INT) {
    clearInterval(window.__NEON_PRELOADER_INT);
    window.__NEON_PRELOADER_INT = 0;
  }
  if (window.__NEON_PULSE_INT) {
    clearInterval(window.__NEON_PULSE_INT);
    window.__NEON_PULSE_INT = 0;
  }

  /**
   * Narandžasti kružni kursor
   */
  const cursorInteractive =
    'a, button, input, textarea, select, [role="button"], label, summary, [data-cursor-hover]';
  const cursorPulseName = 'customCursorPulseRing';

  const mqOnChange = (mq, fn) => {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  };
  const mqOffChange = (mq, fn) => {
    if (mq.removeEventListener) mq.removeEventListener('change', fn);
    else if (mq.removeListener) mq.removeListener(fn);
  };

  function canUseCustomCursor() {
    if (typeof window.matchMedia !== 'function') return false;
    if (window.matchMedia('(pointer: coarse)').matches) return false;
    if (!window.matchMedia('(hover: hover)').matches) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia('(prefers-contrast: more)').matches) return false;
    if (!window.matchMedia('(pointer: fine)').matches) return false;
    return true;
  }

  if (canUseCustomCursor()) {
    const root = document.documentElement;
    root.classList.add('custom-cursor--enabled');

    const cursorEl = document.createElement('div');
    cursorEl.className = 'custom-cursor';
    cursorEl.setAttribute('aria-hidden', 'true');
    const ring = document.createElement('span');
    ring.className = 'custom-cursor__ring';
    cursorEl.appendChild(ring);
    document.body.appendChild(cursorEl);

    let mx = 0;
    let my = 0;
    let rafId = 0;
    let hasShown = false;

    const updateHoverFromPoint = () => {
      if (!hasShown) return;
      const el = document.elementFromPoint(mx, my);
      const hover = !!(el && el.closest && el.closest(cursorInteractive));
      cursorEl.classList.toggle('custom-cursor--hover', hover);
    };

    const runFrame = () => {
      rafId = 0;
      cursorEl.style.transform = `translate3d(${mx}px,${my}px,0)`;
      updateHoverFromPoint();
    };

    const scheduleFrame = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(runFrame);
    };

    const onPointerMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      if (!hasShown) {
        hasShown = true;
        cursorEl.classList.add('custom-cursor--visible');
      }
      scheduleFrame();
    };

    const onScrollOrResize = () => {
      if (!hasShown) return;
      scheduleFrame();
    };

    const pulseDurationMs = 500;
    let pulseEndTimer = 0;

    const clearPulseState = () => {
      if (pulseEndTimer) {
        clearTimeout(pulseEndTimer);
        pulseEndTimer = 0;
      }
      cursorEl.classList.remove('custom-cursor--pulse');
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      if (e.pointerType && e.pointerType !== 'mouse') return;
      clearPulseState();
      void ring.offsetWidth;
      cursorEl.classList.add('custom-cursor--pulse');
      pulseEndTimer = window.setTimeout(clearPulseState, pulseDurationMs + 80);
    };

    const onAnimEnd = (e) => {
      if (e.target !== ring) return;
      const name = String(e.animationName || '');
      if (name.toLowerCase() !== cursorPulseName.toLowerCase()) return;
      clearPulseState();
    };

    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqUsable = window.matchMedia('(pointer: fine) and (hover: hover)');

    const destroyCursor = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      ring.removeEventListener('animationend', onAnimEnd);
      if (rafId) cancelAnimationFrame(rafId);
      clearPulseState();
      mqOffChange(mqMotion, onMotionChange);
      mqOffChange(mqUsable, onUsableChange);
      root.classList.remove('custom-cursor--enabled');
      cursorEl.remove();
    };

    const onMotionChange = () => {
      if (mqMotion.matches) destroyCursor();
    };

    const onUsableChange = () => {
      if (!mqUsable.matches) destroyCursor();
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true, signal: ac });
    document.addEventListener('pointerdown', onPointerDown, { capture: true, signal: ac });
    window.addEventListener('scroll', onScrollOrResize, {
      passive: true,
      capture: true,
      signal: ac,
    });
    window.addEventListener('resize', onScrollOrResize, { passive: true, signal: ac });
    ring.addEventListener('animationend', onAnimEnd, { signal: ac });
    mqOnChange(mqMotion, onMotionChange);
    mqOnChange(mqUsable, onUsableChange);
  }

  if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  const skipPreloader = sessionStorage.getItem('webplace_spa') === '1';
  if (skipPreloader) {
    sessionStorage.removeItem('webplace_spa');
  }

  let reducedMotionBypass =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* allow runtime updates if user/OS changes pref */
  try {
    const mqRm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onRm = () => {
      reducedMotionBypass =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };
    if (mqRm.addEventListener) mqRm.addEventListener('change', onRm, { signal: ac });
    else if (mqRm.addListener) mqRm.addListener(onRm);
  } catch (_) {
    //
  }

  const bypassPreloader = skipPreloader || reducedMotionBypass;

  const preloader = document.getElementById('preloader');
  const loaderBar = document.querySelector('.loader-bar');

  if (bypassPreloader) {
    if (preloader) preloader.remove();
    initAnimations();
  } else if (preloader && loaderBar) {
    let progress = 0;
    window.__NEON_PRELOADER_INT = setInterval(() => {
      progress += 20 + Math.random() * 35;
      if (progress > 100) progress = 100;
      loaderBar.style.width = progress + '%';

      if (progress === 100) {
        clearInterval(window.__NEON_PRELOADER_INT);
        window.__NEON_PRELOADER_INT = 0;
        if (typeof gsap !== 'undefined') {
          preloader.style.pointerEvents = 'none';
          gsap.to(preloader, {
            opacity: 0,
            duration: 0.35,
            onComplete: () => {
              preloader.style.display = 'none';
              initAnimations();
            },
          });
        } else {
          preloader.style.display = 'none';
          initAnimations();
        }
      }
    }, 80);
  } else {
    if (preloader) preloader.remove();
    initAnimations();
  }

  const header = document.getElementById('header');
  const scrollToTopBtn = document.getElementById('scrollToTop');

  window.addEventListener(
    'scroll',
    () => {
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
      if (scrollToTopBtn) {
        const docEl = document.documentElement;
        const scrollable = Math.max(1, docEl.scrollHeight - docEl.clientHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
        scrollToTopBtn.style.setProperty('--scroll-progress', String(progress));
        if (window.scrollY > 500) {
          scrollToTopBtn.classList.add('show');
        } else {
          scrollToTopBtn.classList.remove('show');
        }
      }
    },
    { signal: ac },
  );

  if (scrollToTopBtn) {
    const docEl = document.documentElement;
    const scrollable = Math.max(1, docEl.scrollHeight - docEl.clientHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    scrollToTopBtn.style.setProperty('--scroll-progress', String(progress));
  }

  window.addEventListener(
    'resize',
    () => {
      if (!scrollToTopBtn) return;
      const docEl = document.documentElement;
      const scrollable = Math.max(1, docEl.scrollHeight - docEl.clientHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      scrollToTopBtn.style.setProperty('--scroll-progress', String(progress));
    },
    { signal: ac },
  );

  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener(
      'click',
      () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      { signal: ac },
    );
  }

  const mobileToggle =
    document.getElementById('mobile-nav-toggle') || document.querySelector('.mobile-nav-toggle');
  const mobileOverlay =
    document.getElementById('mobile-navigation') || document.querySelector('.mobile-nav-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-list a');

  /** @returns {HTMLElement[]} */
  function getFocusablesInsideModal() {
    if (!contactModalInner) return [];
    const sel =
      'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';
    return [...contactModalInner.querySelectorAll(sel)].filter(
      /** @param {Element} el */
      (el) => {
        if (!(el instanceof HTMLElement)) return false;
        const inInactiveMv =
          el.closest && el.closest('.modal-view') && !el.closest('.modal-view.active');
        return !inInactiveMv;
      },
    );
  }

  /** @type {HTMLElement | null} */
  let contactModalSavedFocus = null;

  /** @type {null | (() => void)} */
  let dismissMobileNav = null;
  /** @type {null | (() => void)} */
  let maybeCloseModal = null;

  if (mobileToggle && mobileOverlay) {
    function toggleMobileBars(open) {
      const bars = mobileToggle.querySelectorAll('.bar');
      if (!bars.length) return;
      if (open) {
        bars[0].style.transform = 'translateY(10px) rotate(45deg)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'translateY(-10px) rotate(-45deg)';
      } else {
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
      }
    }

    /** @param {boolean} open */
    function setMobileNavOpen(open) {
      mobileOverlay.classList.toggle('active', !!open);
      document.body.style.overflow = open ? 'hidden' : 'auto';
      mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      toggleMobileBars(!!open);
      if (open) {
        const link = mobileOverlay.querySelector('.mobile-nav-list > li:first-child > a');
        if (link instanceof HTMLElement) {
          queueMicrotask(() => link.focus());
        }
      } else {
        mobileToggle.focus();
      }
    }

    mobileToggle.addEventListener(
      'click',
      () => {
        setMobileNavOpen(!mobileOverlay.classList.contains('active'));
      },
      { signal: ac },
    );

    document.querySelectorAll('.dropdown-arrow').forEach((toggle) => {
      const el = toggle;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          const parent = toggle.closest('.mobile-dropdown');
          if (parent) parent.classList.toggle('active');
        },
        { signal: ac },
      );
      el.addEventListener(
        'keydown',
        (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          toggle.click();
        },
        { signal: ac },
      );
    });

    mobileLinks.forEach((link) => {
      if (!link.closest('.mobile-dropdown-header')) {
        link.addEventListener(
          'click',
          () => {
            setMobileNavOpen(false);
          },
          { signal: ac },
        );
      }
    });

    dismissMobileNav = () => setMobileNavOpen(false);
  }

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    if (document.querySelector('#hero')) {
      if (prefersReducedMotion()) {
        gsap.set(
          '#hero .reveal-text, #hero .hero-subline.reveal-up, #hero .reveal-up, #hero .hero-visual-inner, #hero .floating-badge, #hero .hero-circle-bg, #hero .hero-portrait-img',
          {
            opacity: 1,
            scale: 1,
            y: 0,
            clearProps: 'transform',
          },
        );
      } else {
        const heroTl = gsap.timeline({
          defaults: { ease: 'power3.out' },
        });

        heroTl
          .from('#hero .reveal-text', {
            y: 44,
            opacity: 0,
            duration: 1.08,
            ease: 'power4.out',
          })
          .from(
            '#hero .hero-subline.reveal-up, #hero .reveal-up',
            {
              y: 26,
              opacity: 0,
              duration: 0.82,
              stagger: 0.1,
            },
            '-=0.52',
          )
          .from(
            '#hero .hero-visual-inner',
            {
              y: 24,
              opacity: 0,
              duration: 0.92,
              ease: 'power2.out',
            },
            '-=0.58',
          )
          .from(
            '#hero .hero-circle-bg',
            {
              scale: 0.96,
              opacity: 0,
              duration: 0.92,
              ease: 'power2.out',
            },
            '<',
          )
          .from(
            '#hero .hero-portrait-img',
            {
              opacity: 0,
              duration: 0.55,
              ease: 'sine.out',
            },
            '<0.08',
          )
          .from(
            '#hero .floating-badge',
            {
              opacity: 0,
              y: 18,
              duration: 0.68,
              stagger: 0.1,
              ease: 'power2.out',
            },
            '-=0.48',
          );
      }
    }

    const revealElements = [
      { class: '.reveal-left', x: -100 },
      { class: '.reveal-right', x: 100 },
      { class: '.reveal-up', y: 100 },
    ];

    revealElements.forEach((item) => {
      document.querySelectorAll(item.class).forEach((el) => {
        if (el.closest('#hero')) return;
        /* portfolio-item se animira zasebno (trigger: .portfolio-grid) — inače dupli gsap.from drži opacity:0 */
        if (el.classList.contains('portfolio-item')) return;
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
          x: item.x || 0,
          y: item.y || 0,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onStart: () => {
            el.style.willChange = 'transform, opacity';
          },
          onComplete: () => {
            el.style.willChange = 'auto';
          },
        });
      });
    });

    document.querySelectorAll('.number').forEach((num) => {
      const target = parseInt(num.getAttribute('data-target'), 10);
      if (Number.isNaN(target)) return;
      gsap.to(num, {
        scrollTrigger: {
          trigger: num,
          start: 'top 90%',
        },
        innerText: target,
        duration: 2,
        snap: { innerText: 1 },
        ease: 'power2.out',
      });
    });

    if (document.querySelector('.portfolio-grid')) {
      /* Samo pomeraj (y), ne opacity — immediateRender+opacity=0 drži kartice invisible ako refresh ne uspe (preloader/SPA) */
      gsap.from('.portfolio-grid .portfolio-item', {
        y: 36,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: '.portfolio-grid',
          start: 'top 92%',
          once: true,
          toggleActions: 'play none none none',
        },
      });
    }

    if (typeof ScrollTrigger !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      });
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener(
      'click',
      function (e) {
        const href = this.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          try {
            const target = document.querySelector(href);
            if (target) {
              const headerOffset = 80;
              const elementPosition = target.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
              });
            }
          } catch (err) {
            // ignore
          }
        }
      },
      { signal: ac },
    );
  });

  const openContactBtn = document.getElementById('open-contact-modal');
  const closeContactBtn = document.getElementById('close-contact-modal');
  const contactModal = document.getElementById('contact-modal-overlay');
  const contactModalInner = document.getElementById('contact-modal-content');
  const showFormBtn = document.getElementById('show-contact-form-btn');
  const backToOptionsBtn = document.getElementById('back-to-options-btn');
  const viewOptions = document.getElementById('modal-view-options');
  const viewForm = document.getElementById('modal-view-form');

  if (openContactBtn) {
    window.__NEON_PULSE_INT = setInterval(() => {
      openContactBtn.classList.add('pulse-trigger');
      setTimeout(() => {
        openContactBtn.classList.remove('pulse-trigger');
      }, 2000);
    }, 5000);
  }

  if (openContactBtn && contactModal && contactModalInner) {
    function showModalOptions() {
      if (viewOptions) viewOptions.classList.add('active');
      if (viewForm) viewForm.classList.remove('active');
      contactModalInner.classList.remove('contact-modal-content--form');
    }

    function showModalForm() {
      if (viewOptions) viewOptions.classList.remove('active');
      if (viewForm) viewForm.classList.add('active');
      contactModalInner.classList.add('contact-modal-content--form');
      try {
        if (typeof window.__cwpRefreshI18n === 'function') window.__cwpRefreshI18n();
      } catch (_) {
        //
      }
    }

    function moveFocusIntoModal() {
      queueMicrotask(() => {
        const list = getFocusablesInsideModal();
        const c = /** @type {HTMLElement | null} */ (closeContactBtn);
        if (c && list.includes(c)) c.focus();
        else if (list[0]) list[0].focus();
        else contactModalInner.focus();
      });
    }

    function closeModal() {
      contactModal.classList.remove('active');
      contactModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = 'auto';
      showModalOptions();
      if (contactModalInner.getAttribute('tabindex') === '-1')
        contactModalInner.removeAttribute('tabindex');
      const ret = contactModalSavedFocus;
      contactModalSavedFocus = null;
      if (ret && typeof ret.focus === 'function')
        queueMicrotask(() => {
          ret.focus();
        });
    }

    openContactBtn.addEventListener(
      'click',
      () => {
        contactModalSavedFocus = /** @type {HTMLElement} */ (document.activeElement);
        contactModal.classList.add('active');
        contactModal.setAttribute('aria-hidden', 'false');
        contactModalInner.setAttribute('tabindex', '-1');
        document.body.style.overflow = 'hidden';
        showModalOptions();
        moveFocusIntoModal();
      },
      { signal: ac },
    );

    if (closeContactBtn) closeContactBtn.addEventListener('click', closeModal, { signal: ac });

    if (showFormBtn) {
      showFormBtn.addEventListener(
        'click',
        () => {
          showModalForm();
          moveFocusIntoModal();
        },
        { signal: ac },
      );
    }

    if (backToOptionsBtn) {
      backToOptionsBtn.addEventListener(
        'click',
        () => {
          showModalOptions();
          moveFocusIntoModal();
        },
        { signal: ac },
      );
    }

    contactModalInner.addEventListener(
      'keydown',
      (ev) => {
        if (!contactModal.classList.contains('active')) return;
        if (ev.key === 'Tab') {
          const list = getFocusablesInsideModal().filter(Boolean);
          if (list.length < 2) return;
          const first = /** @type {HTMLElement} */ (list[0]);
          const last = /** @type {HTMLElement} */ (list[list.length - 1]);
          if (!ev.shiftKey && document.activeElement === last) {
            ev.preventDefault();
            first.focus();
          } else if (ev.shiftKey && document.activeElement === first) {
            ev.preventDefault();
            last.focus();
          }
        }
      },
      { signal: ac },
    );

    contactModal.addEventListener(
      'click',
      (e) => {
        if (e.target === contactModal) closeModal();
      },
      { signal: ac },
    );

    /** @type {null | typeof closeModal} */
    maybeCloseModal = closeModal;
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape') return;
      if (
        typeof contactModal !== 'undefined' &&
        contactModal &&
        contactModal.classList.contains('active') &&
        maybeCloseModal
      ) {
        maybeCloseModal();
        return;
      }
      if (mobileOverlay && mobileOverlay.classList.contains('active') && dismissMobileNav) {
        dismissMobileNav();
      }
    },
    { signal: ac },
  );

  /** @see CookieBanner.astro — čuva izbor u localStorage, prezivljava SPA zamenu body-ja */
  const CWP_COOKIE_LS = 'cwp_cookie_consent';
  const cookieBanner = document.getElementById('cwp-cookie-banner');
  const cookieAccept = document.getElementById('cwp-cookie-accept');
  const cookieDecline = document.getElementById('cwp-cookie-decline');
  if (cookieBanner) {
    function hideCookieBanner() {
      cookieBanner.classList.remove('cwp-cookie-banner--visible');
      cookieBanner.hidden = true;
      cookieBanner.setAttribute('aria-hidden', 'true');
    }
    function showCookieBanner() {
      cookieBanner.hidden = false;
      cookieBanner.classList.add('cwp-cookie-banner--visible');
      cookieBanner.setAttribute('aria-hidden', 'false');
      queueMicrotask(() => {
        const focusEl = /** @type {HTMLElement | null} */ (cookieAccept || cookieDecline);
        if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
      });
    }
    let consent = null;
    try {
      consent = localStorage.getItem(CWP_COOKIE_LS);
    } catch (_) {
      //
    }
    if (consent === 'accepted' || consent === 'declined') {
      hideCookieBanner();
    } else {
      showCookieBanner();
    }
    const persist = (value) => {
      try {
        localStorage.setItem(CWP_COOKIE_LS, value);
      } catch (_) {
        //
      }
      hideCookieBanner();
    };
    if (cookieAccept)
      cookieAccept.addEventListener('click', () => persist('accepted'), { signal: ac });
    if (cookieDecline)
      cookieDecline.addEventListener('click', () => persist('declined'), { signal: ac });
  }

  initFAQ(ac);

  const currentYearEl = document.getElementById('current-year');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }
}

/* --- SPA: unutrašnji linkovi bez full reloada (fetch + swap body) --- */

function normalizePathname(path) {
  let p = (path || '/').split('?')[0].split('#')[0];
  p = p.replace(/\/index\.html$/i, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p.toLowerCase() || '/';
}

function isSamePageUrl(url) {
  if (url.origin !== location.origin) return false;
  return (
    normalizePathname(url.pathname) === normalizePathname(location.pathname) &&
    (url.search || '') === (location.search || '')
  );
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some((s) => s.src === src)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

async function ensureGsapForDoc(doc) {
  const hasGsap = doc && doc.querySelector && doc.querySelector('script[src*="gsap"]');
  if (!hasGsap) return;
  if (typeof gsap === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js');
  }
  if (typeof ScrollTrigger === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js');
  }
  if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
}

let webplaceNavInFlight = false;

async function webplaceLoadPage(
  absoluteUrl,
  { push, scrollTop } = { push: true, scrollTop: true },
) {
  if (webplaceNavInFlight) return;
  webplaceNavInFlight = true;
  try {
    const res = await fetch(absoluteUrl, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('fetch');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc.body) throw new Error('parse');

    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.getAll) {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    }

    document.title = doc.title;
    document.body.id = doc.body.id;
    document.body.className = doc.body.className;
    const nextPage = doc.body.getAttribute('data-page');
    if (nextPage) document.body.setAttribute('data-page', nextPage);
    else document.body.removeAttribute('data-page');

    const frag = document.createDocumentFragment();
    for (const child of Array.from(doc.body.children)) {
      if (child.tagName === 'SCRIPT') continue;
      frag.appendChild(document.importNode(child, true));
    }
    document.body.replaceChildren(frag);

    if (
      doc.querySelector('head link[rel="stylesheet"][href$="style.css"]') &&
      !document.querySelector('head link[href$="style.css"]')
    ) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'style.css';
      document.head.appendChild(link);
    }

    await ensureGsapForDoc(doc);

    if (typeof window.initCwpI18n === 'function') {
      await window.initCwpI18n();
    }

    sessionStorage.setItem('webplace_spa', '1');
    if (push) {
      const u = new URL(absoluteUrl);
      history.pushState({ webplace: 1 }, '', u.pathname + u.search + u.hash);
    }
    if (scrollTop) window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      initWebPlacePage();
    });
  } catch (err) {
    window.location.assign(absoluteUrl);
  } finally {
    webplaceNavInFlight = false;
  }
}

function webplaceOnDocClick(e) {
  if (e.defaultPrevented || e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a) return;
  if (a.target === '_blank' || a.getAttribute('rel') === 'external') return;
  if (a.hasAttribute('download')) return;

  const hrefAttr = a.getAttribute('href');
  if (hrefAttr == null || hrefAttr.startsWith('javascript:')) return;
  if (/^(mailto|tel|viber|sms|whatsapp):/i.test(hrefAttr)) return;
  if (hrefAttr.startsWith('//')) return;

  let url;
  try {
    url = new URL(a.href, location.href);
  } catch {
    return;
  }
  if (url.origin !== location.origin) return;
  if (/^(mailto|tel|viber|sms|whatsapp):/i.test(url.protocol)) return;

  if (isSamePageUrl(url)) {
    e.preventDefault();
    if (url.hash && url.hash.length > 1) {
      const t = document.querySelector(url.hash);
      if (t) {
        const headerOffset = 80;
        const y = t.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  if (!/\.html$/i.test(url.pathname)) return;

  e.preventDefault();
  void webplaceLoadPage(a.href, { push: true, scrollTop: true });
}

if (!window.__NEON_SPA) {
  window.__NEON_SPA = true;
  document.addEventListener('click', webplaceOnDocClick, true);
  window.addEventListener('popstate', () => {
    void webplaceLoadPage(location.href, { push: false, scrollTop: true });
  });
}

async function webplaceBoot() {
  if (typeof window.initCwpI18n === 'function') {
    await window.initCwpI18n();
  }
  initWebPlacePage();
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void webplaceBoot();
    },
    { once: true },
  );
} else {
  void webplaceBoot();
}

// FAQ Accordion (bound per page init; survives SPA-lite body swap)
function initFAQ(signal) {
  const opts = signal ? { signal } : {};

  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    if (question.getAttribute('data-cwp-heading-wired') === '1') return;
    question.setAttribute('data-cwp-heading-wired', '1');
    question.setAttribute('role', 'button');
    question.setAttribute('tabindex', '0');

    let qid = question.getAttribute('id');
    if (!qid) {
      qid = `faq-heading-${Math.random().toString(36).slice(2, 9)}`;
      question.setAttribute('id', qid);
    }

    const nextEl = question.nextElementSibling;
    const byNext =
      nextEl instanceof HTMLElement && nextEl.classList.contains('faq-answer') ? nextEl : null;
    const aEl = byNext || item.querySelector('.faq-answer');

    if (aEl instanceof HTMLElement && !aEl.id) {
      aEl.id = `${qid}-answer`;
    }
    question.setAttribute('aria-expanded', 'false');
    if (aEl instanceof HTMLElement) question.setAttribute('aria-controls', aEl.id);

    const closeEvery = () => {
      document.querySelectorAll('.faq-item').forEach((otherItem) => {
        otherItem.classList.remove('active');
        const q = otherItem.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
    };

    /** @returns {boolean} opened */
    const flip = () => {
      const wasOpen = item.classList.contains('active');
      closeEvery();
      if (!wasOpen) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        return true;
      }
      return false;
    };

    question.addEventListener(
      'click',
      () => {
        flip();
      },
      opts,
    );

    question.addEventListener(
      'keydown',
      (ev) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        flip();
      },
      opts,
    );
  });
}
