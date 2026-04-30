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
    const cursorInteractive = 'a, button, input, textarea, select, [role="button"], label, summary, [data-cursor-hover]';
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
        window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true, signal: ac });
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

    const preloader = document.getElementById('preloader');
    const loaderBar = document.querySelector('.loader-bar');

    if (skipPreloader) {
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
                        }
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

    window.addEventListener('scroll', () => {
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        if (scrollToTopBtn) {
            if (window.scrollY > 500) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        }
    }, { signal: ac });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener(
            'click',
            () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            { signal: ac }
        );
    }

    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-list a');

    if (mobileToggle && mobileOverlay) {
        mobileToggle.addEventListener('click', () => {
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : 'auto';

            const bars = mobileToggle.querySelectorAll('.bar');
            if (mobileOverlay.classList.contains('active')) {
                bars[0].style.transform = 'translateY(10px) rotate(45deg)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'translateY(-10px) rotate(-45deg)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        }, { signal: ac });

        document.querySelectorAll('.dropdown-arrow').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = toggle.closest('.mobile-dropdown');
                if (parent) parent.classList.toggle('active');
            }, { signal: ac });
        });

        mobileLinks.forEach(link => {
            if (!link.closest('.mobile-dropdown-header')) {
                link.addEventListener('click', () => {
                    mobileOverlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    const bars = mobileToggle.querySelectorAll('.bar');
                    bars[0].style.transform = 'none';
                    bars[1].style.opacity = '1';
                    bars[2].style.transform = 'none';
                }, { signal: ac });
            }
        });
    }

    function initAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        const heroTl = gsap.timeline();
        heroTl.from('#hero .reveal-text', {
            y: 100,
            opacity: 0,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.2
        })
            .from('#hero .reveal-up', {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                stagger: 0.2
            }, '-=0.8')
            .from('#hero .blob', {
                scale: 0,
                duration: 2,
                ease: 'elastic.out(1, 0.5)',
                stagger: 0.3
            }, '-=1.5');

        const revealElements = [
            { class: '.reveal-left', x: -100 },
            { class: '.reveal-right', x: 100 },
            { class: '.reveal-up', y: 100 }
        ];

        revealElements.forEach(item => {
            document.querySelectorAll(item.class).forEach(el => {
                if (el.closest('#hero')) return;
                /* portfolio-item se animira zasebno (trigger: .portfolio-grid) — inače dupli gsap.from drži opacity:0 */
                if (el.classList.contains('portfolio-item')) return;
                gsap.from(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 92%',
                        toggleActions: 'play none none none'
                    },
                    x: item.x || 0,
                    y: item.y || 0,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    onStart: () => { el.style.willChange = 'transform, opacity'; },
                    onComplete: () => { el.style.willChange = 'auto'; }
                });
            });
        });

        document.querySelectorAll('.number').forEach(num => {
            const target = parseInt(num.getAttribute('data-target'), 10);
            if (Number.isNaN(target)) return;
            gsap.to(num, {
                scrollTrigger: {
                    trigger: num,
                    start: 'top 90%'
                },
                innerText: target,
                duration: 2,
                snap: { innerText: 1 },
                ease: 'power2.out'
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
                    toggleActions: 'play none none none'
                }
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



    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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
                            behavior: 'smooth'
                        });
                    }
                } catch (err) {
                    // ignore
                }
            }
        }, { signal: ac });
    });

    const openContactBtn = document.getElementById('open-contact-modal');
    const phonePulseBtn = document.getElementById('phone-pulse');
    const closeContactBtn = document.getElementById('close-contact-modal');
    const contactModal = document.getElementById('contact-modal-overlay');
    const showFormBtn = document.getElementById('show-contact-form-btn');
    const backToOptionsBtn = document.getElementById('back-to-options-btn');
    const viewOptions = document.getElementById('modal-view-options');
    const viewForm = document.getElementById('modal-view-form');

    if (phonePulseBtn) {
        window.__NEON_PULSE_INT = setInterval(() => {
            phonePulseBtn.classList.add('pulse-trigger');
            setTimeout(() => {
                phonePulseBtn.classList.remove('pulse-trigger');
            }, 2000);
        }, 5000);
    }

    if (openContactBtn && contactModal) {

        openContactBtn.addEventListener('click', () => {
            contactModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (viewOptions && viewForm) {
                viewOptions.classList.remove('active');
                viewForm.classList.add('active');
            }
        }, { signal: ac });


        const closeModal = () => {
            contactModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        if (closeContactBtn) closeContactBtn.addEventListener('click', closeModal, { signal: ac });

        if (showFormBtn) {
            showFormBtn.addEventListener('click', () => {
                viewOptions.classList.remove('active');
                viewForm.classList.add('active');
            }, { signal: ac });
        }



        if (backToOptionsBtn) {
            backToOptionsBtn.addEventListener('click', () => {
                viewForm.classList.remove('active');
                viewOptions.classList.add('active');
            }, { signal: ac });
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
                closeModal();
            }
        }, { signal: ac });

        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                closeModal();
            }
        }, { signal: ac });
    }



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
        if ([...document.scripts].some(s => s.src === src)) {
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

async function webplaceLoadPage(absoluteUrl, { push, scrollTop } = { push: true, scrollTop: true }) {
    if (webplaceNavInFlight) return;
    webplaceNavInFlight = true;
    try {
        const res = await fetch(absoluteUrl, { credentials: 'same-origin' });
        if (!res.ok) throw new Error('fetch');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (!doc.body) throw new Error('parse');

        if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.getAll) {
            ScrollTrigger.getAll().forEach(t => t.kill());
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

        if (doc.querySelector('head link[rel="stylesheet"][href$="style.css"]') && !document.querySelector('head link[href$="style.css"]')) {
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
    document.addEventListener('DOMContentLoaded', () => {
        void webplaceBoot();
    }, { once: true });
} else {
    void webplaceBoot();
}

// FAQ Accordion
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close other items
            faqItems.forEach(otherItem => otherItem.classList.remove('active'));
            
            // Toggle current
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Add initFAQ to existing initWebPlacePage or window.onload
document.addEventListener('DOMContentLoaded', () => {
    initFAQ();
});
