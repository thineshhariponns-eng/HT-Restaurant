/* HT Restaurant — main-domain welcome page motion (Views/Home/Portal).
   Stack: GSAP + ScrollTrigger for animation, Lenis as the only smooth-scroll engine (vendored in /lib). No Three.js:
   the page is photographic and typographic, so a shader canvas would have no job to do.
   Everything is progressive. The navigation (mobile menu, active-section marker) runs without any library; the
   animation layer is skipped under prefers-reduced-motion or when a library fails to load, and the page then shows its
   final state (the .js-motion class that hides pre-animation states is removed). */
(function () {
  'use strict';

  var root = document.documentElement;
  var cleanups = [];
  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanups.push(function () { target.removeEventListener(type, handler, options); });
  }

  /* ---------- Navigation: mobile panel + active section (no libraries needed) ---------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  var headerEl = document.querySelector('[data-header]');

  function setMenu(open, returnFocus) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) nav.setAttribute('data-open', ''); else nav.removeAttribute('data-open');
    if (!open && returnFocus) toggle.focus();
  }
  if (toggle && nav) {
    // The panel is hidden with visibility:hidden on small screens, so closed links are not focusable.
    listen(toggle, 'click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    listen(document, 'keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    listen(document, 'pointerdown', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !headerEl.contains(e.target)) setMenu(false);
    });
    listen(window.matchMedia('(min-width: 720px)'), 'change', function () { setMenu(false); });
  }

  /* ---------- Locations pop-up (native <dialog>; content comes later) ---------- */
  var dialog = document.querySelector('[data-locations]');
  var lenis = null;
  function openLocations() {
    if (!dialog || dialog.open) return;
    setMenu(false);
    if (lenis) lenis.stop();
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }
  if (dialog) {
    Array.prototype.slice.call(document.querySelectorAll('[data-locations-open]')).forEach(function (btn) {
      listen(btn, 'click', function (e) {
        if (btn.tagName === 'A') e.preventDefault();
        openLocations();
      });
    });
    Array.prototype.slice.call(dialog.querySelectorAll('[data-locations-close]')).forEach(function (btn) {
      listen(btn, 'click', function () { dialog.close(); });
    });
    // Click on the backdrop (the dialog element itself, outside its panel content) closes it.
    listen(dialog, 'click', function (e) { if (e.target === dialog) dialog.close(); });
    listen(dialog, 'close', function () { if (lenis) lenis.start(); });

    // City search: filters the list as you type.
    var search = dialog.querySelector('[data-city-search]');
    var cityItems = Array.prototype.slice.call(dialog.querySelectorAll('[data-city]'));
    var emptyMsg = dialog.querySelector('[data-city-empty]');
    var statusEl = dialog.querySelector('[data-city-status]');
    if (search) {
      listen(search, 'input', function () {
        var q = search.value.trim().toLowerCase();
        var shown = 0;
        cityItems.forEach(function (li) {
          var match = !q || li.getAttribute('data-name').toLowerCase().indexOf(q) !== -1;
          li.hidden = !match;
          if (match) shown++;
        });
        if (emptyMsg) emptyMsg.hidden = shown > 0;
      });
    }
    listen(dialog, 'close', function () {
      if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
      if (statusEl) statusEl.textContent = '';
      cityItems.forEach(function (li) { li.classList.remove('is-nearest'); });
    });

    // Detect my location: highlight the nearest city (straight-line distance). Nothing leaves the browser.
    var detect = dialog.querySelector('[data-city-detect]');
    if (detect) {
      listen(detect, 'click', function () {
        if (!navigator.geolocation) { statusEl.textContent = 'Location is not available in this browser. Search for your city instead.'; return; }
        detect.disabled = true;
        statusEl.textContent = 'Finding your location...';
        navigator.geolocation.getCurrentPosition(function (pos) {
          detect.disabled = false;
          var rad = Math.PI / 180, best = null, bestKm = Infinity;
          cityItems.forEach(function (li) {
            var lat = parseFloat(li.getAttribute('data-lat')), lon = parseFloat(li.getAttribute('data-lon'));
            var dLat = (lat - pos.coords.latitude) * rad, dLon = (lon - pos.coords.longitude) * rad;
            var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(pos.coords.latitude * rad) * Math.cos(lat * rad) * Math.pow(Math.sin(dLon / 2), 2);
            var km = 12742 * Math.asin(Math.sqrt(h));
            if (km < bestKm) { bestKm = km; best = li; }
          });
          cityItems.forEach(function (li) { li.classList.toggle('is-nearest', li === best); });
          if (best) statusEl.textContent = 'Nearest city: ' + best.getAttribute('data-name') + '.';
        }, function () {
          detect.disabled = false;
          statusEl.textContent = 'We could not get your location. Search for your city instead.';
        }, { timeout: 10000, maximumAge: 300000 });
      });
    }
  }

  /* ---------- Animation layer ---------- */
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function showFinalState() { root.classList.remove('js-motion'); }

  // Links to the page you are already on ("Home" on "/") scroll to the top instead of reloading.
  Array.prototype.slice.call(document.querySelectorAll('[data-nav-link]')).forEach(function (link) {
    listen(link, 'click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.pathname !== location.pathname) return;
      e.preventDefault();
      setMenu(false);
      if (lenis) lenis.scrollTo(0, { duration: 1.2 }); else window.scrollTo(0, 0);
    });
  });

  if (reduceQuery.matches || !window.gsap || !window.ScrollTrigger || !window.Lenis) {
    showFinalState();
    return;
  }
  window.__ptMotion = true; // tells the inline safety timeout that init succeeded

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll: Lenis, driven by the GSAP ticker */
  lenis = new window.Lenis({
    duration: 1.1,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
  });
  lenis.on('scroll', ScrollTrigger.update);
  var tick = function (time) { lenis.raf(time * 1000); };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  /* Word splitting (accessible): the heading keeps its full text as aria-label, each visual word is aria-hidden.
     Links are never split. Without JS the heading is plain text. */
  function splitWords(el) {
    var probe = document.createElement('div');
    probe.innerHTML = el.innerHTML;
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

  function markIn(els) { [].concat(els).forEach(function (el) { el.classList.add('is-in'); }); }
  function settle(els) { markIn(els); gsap.set(els, { clearProps: 'opacity,transform,visibility' }); }

  var heroRoot = document.querySelector('[data-hero-root]');
  var heroTitle = document.querySelector('h1[data-split]');
  var splitGroups = Array.prototype.slice.call(document.querySelectorAll('[data-split]')).map(function (el) {
    var words = splitWords(el);
    gsap.set(words, { yPercent: 115 });
    el.classList.add('is-split'); // reveals the heading; the words are already masked
    return { el: el, words: words };
  });

  /* ---------- Hero intro ---------- */
  var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if (headerEl) intro.fromTo(headerEl, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.8, onComplete: function () { settle(headerEl); } }, 0);

  var heroGroup = splitGroups.filter(function (g) { return g.el === heroTitle; })[0];
  if (heroGroup) intro.to(heroGroup.words, { yPercent: 0, duration: 0.95, stagger: 0.07 }, 0.2);

  Array.prototype.slice.call(document.querySelectorAll('[data-hero]')).forEach(function (el, i) {
    intro.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, onComplete: function () { settle(el); } }, 0.45 + i * 0.14);
  });

  var tiles = gsap.utils.toArray('[data-tile]');
  tiles.forEach(function (tile, i) {
    var img = tile.querySelector('img');
    intro.fromTo(tile, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1.05, ease: 'power4.out', onComplete: function () { settle(tile); } }, 0.3 + i * 0.09);
    if (img) intro.fromTo(img, { scale: 1.22 }, { scale: 1, duration: 1.5, ease: 'power3.out', clearProps: 'transform' }, 0.3 + i * 0.09);
  });

  /* ---------- Hero scroll: each column drifts at its own speed ---------- */
  if (heroRoot) {
    gsap.utils.toArray('[data-col]').forEach(function (col) {
      gsap.to(col, {
        y: parseFloat(col.getAttribute('data-col')), ease: 'none',
        scrollTrigger: { trigger: heroRoot, start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Hero pointer response (additive, fine pointers only) ---------- */
  if (heroRoot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cols = gsap.utils.toArray('[data-col]');
    var lattice = heroRoot.querySelector('.pt-hero__lattice');
    var depth = [14, -10, 8];
    var colX = cols.map(function (col) { return gsap.quickTo(col, 'x', { duration: 0.9, ease: 'power3.out' }); });
    var latX = lattice && gsap.quickTo(lattice, 'x', { duration: 1.2, ease: 'power3.out' });
    var latY = lattice && gsap.quickTo(lattice, 'y', { duration: 1.2, ease: 'power3.out' });
    var last = null, moveRaf = 0;

    var apply = function () {
      moveRaf = 0;
      if (!last) return;
      var r = heroRoot.getBoundingClientRect();
      var nx = (last.x - r.left) / r.width - 0.5;
      var ny = (last.y - r.top) / r.height - 0.5;
      colX.forEach(function (setX, i) { setX(nx * depth[i % depth.length]); });
      if (latX) { latX(nx * -24); latY(ny * -16); }
    };
    var rest = function () {
      last = null;
      colX.forEach(function (setX) { setX(0); });
      if (latX) { latX(0); latY(0); }
    };
    listen(heroRoot, 'pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      last = { x: e.clientX, y: e.clientY };
      if (!moveRaf) moveRaf = requestAnimationFrame(apply); // one update per frame
    }, { passive: true });
    listen(heroRoot, 'pointerleave', rest);
    listen(window, 'blur', rest);
    listen(document, 'visibilitychange', function () { if (document.hidden) rest(); });
    cleanups.push(function () { cancelAnimationFrame(moveRaf); });
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

  // Supporting copy, actions and the bands themselves: rise once.
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.set(el, { opacity: 0, y: 22 });
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: function () {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'power3.out', onComplete: function () { settle(el); } });
      }
    });
  });

  // Band photographs drift inside their frame.
  gsap.utils.toArray('.pt-band__media img').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, {
      yPercent: 6, scale: 1.14, ease: 'none',
      scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Grouped items (feature list, badges, value cards): staggered entrance.
  gsap.utils.toArray('[data-stagger]').forEach(function (group) {
    var items = Array.prototype.slice.call(group.children);
    gsap.set(items, { opacity: 0, y: 32 });
    ScrollTrigger.create({
      trigger: group, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(items, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out', onComplete: function () { settle(items); } });
      }
    });
  });

  // Banner photograph: settles in on load, then drifts slower than the page.
  var bannerPhoto = document.querySelector('.pt-banner__photo');
  if (bannerPhoto) {
    var bannerImg = bannerPhoto.querySelector('img');
    intro.fromTo(bannerImg, { scale: 1.18 }, { scale: 1.08, duration: 1.8, ease: 'power3.out' }, 0.1);
    gsap.to(bannerImg, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: bannerPhoto, start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Trending gallery: staggered entrance.
  var gallery = gsap.utils.toArray('[data-gallery-item]');
  if (gallery.length) {
    gsap.set(gallery, { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: '.pt-gallery', start: 'top 85%', once: true,
      onEnter: function () {
        gsap.to(gallery, { opacity: 1, y: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out', onComplete: function () { settle(gallery); } });
      }
    });
  }

  /* ---------- Measurements: refresh once fonts and images settle ---------- */
  var refresh = function () { ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if (document.readyState !== 'complete') listen(window, 'load', refresh);


  /* ---------- Cleanup ---------- */
  window.addEventListener('pagehide', function (e) {
    if (e.persisted) return; // page may be restored from the back/forward cache: keep everything alive
    cleanups.forEach(function (fn) { fn(); });
    gsap.ticker.remove(tick);
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    lenis.destroy();
  });
})();
