/* HT Restaurant Erode — landing page motion.
   Stack: GSAP + ScrollTrigger (animation), Lenis (the only smooth-scroll engine), vendored in /lib.
   Everything here is progressive: without JS, or under prefers-reduced-motion, the page renders in its final
   state (the .js-motion class that hides pre-animation states is never applied or is removed). */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showFinalState() {
    root.classList.remove('js-motion');
  }

  if (reduceQuery.matches || !window.gsap || !window.ScrollTrigger || !window.Lenis) {
    showFinalState();
    return;
  }
  window.__lpMotion = true; // tells the inline safety timeout that init succeeded

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var cleanups = [];
  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanups.push(function () { target.removeEventListener(type, handler, options); });
  }

  /* ---------- Smooth scroll: Lenis, driven by the GSAP ticker ---------- */
  var lenis = new window.Lenis({
    duration: 1.1,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
  });
  lenis.on('scroll', ScrollTrigger.update);
  var tick = function (time) { lenis.raf(time * 1000); };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  /* ---------- Word splitting (accessible) ---------- */
  // The heading keeps its full text as aria-label; every visual word is aria-hidden. Links are never split.
  function splitWords(el) {
    var probe = document.createElement('div');
    probe.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, ' ');
    el.setAttribute('aria-label', probe.textContent.replace(/\s+/g, ' ').trim());

    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var mask = document.createElement('span');
            mask.className = 'w';
            mask.setAttribute('aria-hidden', 'true');
            var inner = document.createElement('span');
            inner.className = 'w-i';
            inner.textContent = part;
            mask.appendChild(inner);
            frag.appendChild(mask);
            words.push(inner);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR' && child.tagName !== 'A') {
          walk(child);
        }
      });
    })(el);
    return words;
  }

  var hero = document.querySelector('.lp-hero');
  var heroImg = document.querySelector('.lp-hero__img');
  var heroTitle = document.querySelector('.lp-hero h1[data-split]');
  var splitGroups = Array.prototype.slice.call(document.querySelectorAll('[data-split]')).map(function (el) {
    var words = splitWords(el);
    gsap.set(words, { yPercent: 115 });
    el.classList.add('is-split'); // reveals the heading; the words are already masked
    return { el: el, words: words };
  });

  function markIn(els) {
    [].concat(els).forEach(function (el) { el.classList.add('is-in'); });
  }
  function settle(els) {
    markIn(els);
    gsap.set(els, { clearProps: 'opacity,transform,visibility' });
  }

  /* ---------- Hero intro (GSAP timeline) ---------- */
  var heroItems = Array.prototype.slice.call(document.querySelectorAll('[data-hero]'));
  var ticket = document.querySelector('[data-ticket]');
  var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (heroImg) intro.fromTo(heroImg, { scale: 1.18 }, { scale: 1.06, duration: 2.2, ease: 'power2.out' }, 0);
  heroItems.forEach(function (el, i) {
    var isTicket = el === ticket;
    var at = isTicket ? 0.7 : 0.55 + i * 0.12;
    intro.fromTo(el,
      isTicket ? { opacity: 0, y: 48, rotate: -6 } : { opacity: 0, y: 14 },
      isTicket ? { opacity: 1, y: 0, rotate: -2.2, duration: 1, onComplete: function () { markIn(el); } }
               : { opacity: 1, y: 0, duration: 0.7, onComplete: function () { settle(el); } },
      at);
  });
  var heroGroup = splitGroups.filter(function (g) { return g.el === heroTitle; })[0];
  if (heroGroup) intro.to(heroGroup.words, { yPercent: 0, duration: 0.95, stagger: 0.09 }, 0.2);

  /* ---------- Hero scroll: the photo drifts slower than the page ---------- */
  if (hero && heroImg) {
    gsap.to(heroImg, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Hero pointer response (additive, fine pointers only) ---------- */
  if (hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tx = 0.72, ty = 0.38, cx = tx, cy = ty, glowRaf = 0, moveRaf = 0, last = null;
    var imgX = heroImg && gsap.quickTo(heroImg, 'x', { duration: 0.9, ease: 'power3.out' });
    var imgY = heroImg && gsap.quickTo(heroImg, 'y', { duration: 0.9, ease: 'power3.out' });
    var tkX = ticket && gsap.quickTo(ticket, 'x', { duration: 0.9, ease: 'power3.out' });
    var tkY = ticket && gsap.quickTo(ticket, 'y', { duration: 0.9, ease: 'power3.out' });

    var glowLoop = function () {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      hero.style.setProperty('--mx', (cx * 100).toFixed(2) + '%');
      hero.style.setProperty('--my', (cy * 100).toFixed(2) + '%');
      glowRaf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(glowLoop) : 0;
    };
    var applyMove = function () {
      moveRaf = 0;
      if (!last) return;
      var r = hero.getBoundingClientRect();
      var nx = (last.x - r.left) / r.width;
      var ny = (last.y - r.top) / r.height;
      tx = nx; ty = ny;
      if (imgX) { imgX((nx - 0.5) * -22); imgY((ny - 0.5) * -14); }
      if (tkX) { tkX((nx - 0.5) * 12); tkY((ny - 0.5) * 8); }
      if (!glowRaf) glowRaf = requestAnimationFrame(glowLoop);
    };
    var rest = function () {
      last = null;
      tx = 0.72; ty = 0.38;
      if (imgX) { imgX(0); imgY(0); }
      if (tkX) { tkX(0); tkY(0); }
      if (!glowRaf) glowRaf = requestAnimationFrame(glowLoop);
    };

    listen(hero, 'pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      last = { x: e.clientX, y: e.clientY };
      if (!moveRaf) moveRaf = requestAnimationFrame(applyMove); // one update per frame
    }, { passive: true });
    listen(hero, 'pointerleave', rest);
    listen(window, 'blur', rest);
    listen(document, 'visibilitychange', function () { if (document.hidden) rest(); });
    cleanups.push(function () { cancelAnimationFrame(glowRaf); cancelAnimationFrame(moveRaf); });
  }

  /* ---------- Section choreography ---------- */
  // Headings: word by word.
  splitGroups.forEach(function (group) {
    if (group.el === heroTitle) return;
    ScrollTrigger.create({
      trigger: group.el, start: 'top 86%', once: true,
      onEnter: function () { gsap.to(group.words, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'power4.out' }); }
    });
  });

  // Supporting copy and blocks: rise once.
  Array.prototype.slice.call(document.querySelectorAll('[data-reveal]')).forEach(function (el) {
    gsap.set(el, { opacity: 0, y: 18 });
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: function () {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.75, delay: 0.12, ease: 'power3.out', onComplete: function () { settle(el); } });
      }
    });
  });

  // Dishes: staggered entrance.
  var dishes = gsap.utils.toArray('.lp-dish');
  if (dishes.length) {
    gsap.set(dishes, { opacity: 0, y: 28 });
    ScrollTrigger.create({
      trigger: '.lp-carousel', start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(dishes, { opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out', onComplete: function () { gsap.set(dishes, { clearProps: 'opacity,transform' }); } });
      }
    });
  }

  // Ways: the big numerals drift against the scroll.
  gsap.utils.toArray('.lp-step').forEach(function (step) {
    var no = step.querySelector('.lp-step__no');
    if (!no) return;
    gsap.fromTo(no, { yPercent: 18 }, {
      yPercent: -18, ease: 'none',
      scrollTrigger: { trigger: step, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Story photos: unmasked once, then a slow parallax inside the frame.
  gsap.utils.toArray('.lp-frame__img').forEach(function (frame) {
    var img = frame.querySelector('img');
    ScrollTrigger.create({
      trigger: frame, start: 'top 85%', once: true,
      onEnter: function () {
        gsap.fromTo(frame, { clipPath: 'inset(0 0 100% 0)' }, {
          clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'power3.inOut',
          onComplete: function () { markIn(frame); gsap.set(frame, { clearProps: 'clipPath' }); }
        });
      }
    });
    if (img) {
      gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  });

  // Menu board: runs only while it is on screen.
  var marquee = document.querySelector('[data-marquee]');
  var marqueeTrack = document.querySelector('[data-marquee-track]');
  if (marquee && marqueeTrack) {
    var run = gsap.to(marqueeTrack, { xPercent: -50, duration: 36, ease: 'none', repeat: -1, paused: true });
    ScrollTrigger.create({
      trigger: marquee, start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { if (self.isActive) run.play(); else run.pause(); }
    });
  }

  /* ---------- Measurements: refresh after fonts and media ---------- */
  var refreshTimer = 0;
  function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 150);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  Array.prototype.forEach.call(document.images, function (img) {
    if (!img.complete) listen(img, 'load', refresh, { once: true });
  });
  listen(window, 'load', refresh, { once: true });

  /* ---------- Teardown ---------- */
  var destroyed = false;
  function destroy(showFinal) {
    if (destroyed) return;
    destroyed = true;
    cleanups.forEach(function (fn) { fn(); });
    clearTimeout(refreshTimer);
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    gsap.ticker.remove(tick);
    lenis.destroy();
    intro.kill();
    if (showFinal) {
      // Motion preference flipped on: jump every element to its final state.
      splitGroups.forEach(function (g) { gsap.set(g.words, { yPercent: 0 }); });
      var all = Array.prototype.slice.call(document.querySelectorAll('[data-hero], [data-reveal], .lp-dish, .lp-frame__img, .lp-frame__img img, .lp-hero__img, [data-marquee-track]'));
      gsap.killTweensOf(all);
      gsap.set(all, { clearProps: 'all' });
      markIn(all);
      showFinalState();
    }
  }
  listen(window, 'pagehide', function () { destroy(false); }, { once: true });
  var onMotionPref = function (e) { if (e.matches) destroy(true); };
  if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onMotionPref);
  cleanups.push(function () { if (reduceQuery.removeEventListener) reduceQuery.removeEventListener('change', onMotionPref); });
})();
