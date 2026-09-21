/* Admin presentation only: the dashboard figures count up once on load.
   The final value is already in the HTML, so nothing here changes the data, and it is skipped
   entirely under prefers-reduced-motion. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.metric-grid .metric-card strong').forEach(function (el, index) {
    var text = el.textContent.trim();
    var match = text.match(/^(\D*)([\d,]+(?:\.\d+)?)(\D*)$/);
    if (!match) return;
    var end = parseFloat(match[2].replace(/,/g, ''));
    if (!(end > 0)) return; // nothing to count to

    var decimals = (match[2].split('.')[1] || '').length;
    var format = function (value) { return match[1] + value.toFixed(decimals) + match[3]; };
    var duration = 800;
    var start = null;

    el.setAttribute('aria-label', text); // screen readers get the final figure, not the ticks
    el.textContent = format(0);

    function step(now) {
      if (start === null) start = now;
      var progress = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = progress < 1 ? format(end * eased) : text;
      if (progress < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 150 + index * 50);
  });
})();
