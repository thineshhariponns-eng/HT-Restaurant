/* Consultant portal: Markdown composer (Write/Preview + toolbar) and rendering of posted text.
   Server output is always escaped plain text; this only turns it into formatted HTML in the browser. */
(function () {
  'use strict';

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>');
    return s;
  }

  function render(text) {
    var out = [];
    var list = null;

    function close() {
      if (list) { out.push('</' + list + '>'); list = null; }
    }
    function open(tag) {
      if (list === tag) return;
      close();
      out.push('<' + tag + '>');
      list = tag;
    }

    text.split(/\r?\n/).forEach(function (line) {
      var m;
      if ((m = line.match(/^\s*[-*]\s+\[( |x)\]\s+(.*)$/i))) {
        open('ul');
        out.push('<li>' + (m[1] === ' ' ? '☐ ' : '☑ ') + inline(m[2]) + '</li>');
      } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
        open('ul');
        out.push('<li>' + inline(m[1]) + '</li>');
      } else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
        open('ol');
        out.push('<li>' + inline(m[1]) + '</li>');
      } else {
        close();
        if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
          var level = m[1].length + 2;
          out.push('<h' + level + '>' + inline(m[2]) + '</h' + level + '>');
        } else if ((m = line.match(/^>\s?(.*)$/))) {
          out.push('<blockquote>' + inline(m[1]) + '</blockquote>');
        } else if (line.trim() !== '') {
          out.push('<p>' + inline(line) + '</p>');
        }
      }
    });
    close();
    return out.join('');
  }

  function show(el, text) {
    el.innerHTML = render(text);
    el.classList.add('is-rendered');
  }

  document.querySelectorAll('[data-md]').forEach(function (el) { show(el, el.textContent); });

  var wrap = { bold: '**', italic: '*', code: '`' };
  var prefix = { heading: '### ', quote: '> ', ul: '- ', ol: '1. ', task: '- [ ] ' };

  document.querySelectorAll('[data-composer]').forEach(function (box) {
    var area = box.querySelector('textarea');
    var preview = box.querySelector('.composer-preview');
    var tabs = box.querySelectorAll('[data-tab]');
    var tools = box.querySelector('.composer-tools');

    function select(name) {
      var previewing = name === 'preview';
      tabs.forEach(function (tab) { tab.setAttribute('aria-selected', String(tab.dataset.tab === name)); });
      area.hidden = previewing;
      tools.hidden = previewing;
      preview.hidden = !previewing;
      if (previewing) {
        var text = area.value.trim();
        if (text) show(preview, text);
        else preview.innerHTML = '<p class="text-muted">Nothing to preview</p>';
      } else {
        area.focus();
      }
    }
    tabs.forEach(function (tab) { tab.addEventListener('click', function () { select(tab.dataset.tab); }); });

    tools.addEventListener('click', function (event) {
      var button = event.target.closest('[data-fmt]');
      if (!button) return;
      var kind = button.dataset.fmt;
      var start = area.selectionStart;
      var end = area.selectionEnd;
      var value = area.value;
      var selected = value.slice(start, end);

      if (wrap[kind]) {
        area.setRangeText(wrap[kind] + selected + wrap[kind], start, end, 'select');
      } else if (kind === 'link') {
        area.setRangeText('[' + (selected || 'text') + '](https://)', start, end, 'select');
      } else if (prefix[kind]) {
        var from = value.lastIndexOf('\n', start - 1) + 1;
        var block = value.slice(from, end).split('\n').map(function (line) { return prefix[kind] + line; }).join('\n');
        area.setRangeText(block, from, end, 'select');
      }
      area.focus();
    });
  });
})();
