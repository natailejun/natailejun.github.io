/* ==========================================================================
   2026 — interaction layer for the dark glass / bento theme
   Injects the aurora + grain layers, the home bento hero, scroll reveals,
   the shrinking pill nav and a self contained Ctrl+K search overlay.
   Wrapped in an IIFE, no globals, safe to delete.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  /* ---------------------------------------------------------------- layers */

  function injectLayers() {
    if (doc.querySelector('.aurora')) return;

    var aurora = doc.createElement('div');
    aurora.className = 'aurora';
    aurora.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i++) {
      var blob = doc.createElement('span');
      blob.className = 'aurora-blob';
      aurora.appendChild(blob);
    }

    var grain = doc.createElement('div');
    grain.className = 'grain';
    grain.setAttribute('aria-hidden', 'true');

    doc.body.insertBefore(grain, doc.body.firstChild);
    doc.body.insertBefore(aurora, doc.body.firstChild);
  }

  /* ------------------------------------------------------------ pill header */

  function initHeader() {
    var header = doc.querySelector('.header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* -------------------------------------------------------------- home hero */

  function statLabel(text) {
    var map = {
      '日志': 'POSTS',
      '文章': 'POSTS',
      '分类': 'CATEGORIES',
      '标签': 'TAGS',
      '归档': 'ARCHIVES'
    };
    var trimmed = (text || '').replace(/\s+/g, '');
    return map[trimmed] || trimmed;
  }

  function initHome() {
    var index = doc.querySelector('.main-inner.index');
    if (!index) return;

    var blocks = [];
    for (var i = 0; i < index.children.length; i++) {
      if (index.children[i].classList.contains('post-block')) blocks.push(index.children[i]);
    }

    if (!doc.querySelector('.bento-hero')) {
      var titleEl = doc.querySelector('.site-title');
      var name = (titleEl && titleEl.textContent.trim()) || 'Natalie Jun';
      var words = name.split(/\s+/);
      var last = words.length > 1 ? words.pop() : '';
      var first = words.join(' ');

      var descEl = doc.querySelector('.site-description') || doc.querySelector('.site-subtitle');
      var desc = (descEl && descEl.textContent.trim()) || '分享生活与技术。';

      var hero = doc.createElement('section');
      hero.className = 'bento-hero';

      var kicker = doc.createElement('p');
      kicker.className = 'hero-kicker';
      kicker.textContent = 'Personal blog · est. 2026';
      hero.appendChild(kicker);

      var h1 = doc.createElement('h1');
      h1.className = 'hero-title';
      if (last) {
        h1.appendChild(doc.createTextNode(first + ' '));
        var span = doc.createElement('span');
        span.textContent = last;
        h1.appendChild(span);
      } else {
        h1.textContent = name;
      }
      hero.appendChild(h1);

      var descP = doc.createElement('p');
      descP.className = 'hero-desc';
      descP.textContent = desc;
      hero.appendChild(descP);

      var statItems = doc.querySelectorAll('.site-state-item');
      if (statItems.length) {
        var stats = doc.createElement('div');
        stats.className = 'hero-stats';
        for (var s = 0; s < statItems.length; s++) {
          var countEl = statItems[s].querySelector('.site-state-item-count');
          var labelEl = statItems[s].querySelector(
            '.site-state-item-name, .site-state-item-label'
          );
          if (!countEl) continue;
          var labelText = labelEl ? labelEl.textContent.trim() : '';
          if (!labelText) {
            var cls = statItems[s].className || '';
            labelText = /posts/.test(cls)
              ? '日志'
              : /categories/.test(cls)
              ? '分类'
              : /tags/.test(cls)
              ? '标签'
              : '';
          }
          var pill = doc.createElement('span');
          pill.className = 'hero-stat';
          var b = doc.createElement('b');
          b.textContent = countEl.textContent.trim();
          pill.appendChild(b);
          pill.appendChild(doc.createTextNode(statLabel(labelText)));
          stats.appendChild(pill);
        }
        if (stats.children.length) hero.appendChild(stats);
      }

      index.insertBefore(hero, index.firstChild);
    }

    /* bento card classes: odd cards in the second column get pushed down */
    for (var bIdx = 0; bIdx < blocks.length; bIdx++) {
      blocks[bIdx].classList.add('bento-card');
      if (bIdx % 2 === 1) blocks[bIdx].classList.add('bento-card--drop');
    }
  }

  /* --------------------------------------------------------- scroll reveals */

  function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          entries[i].target.classList.add('nx-visible');
          observer.unobserve(entries[i].target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );

    function reveal(el, delay) {
      if (!el || el.nodeType !== 1 || el.classList.contains('nx-reveal')) return;
      el.classList.add('nx-reveal');
      if (delay) el.style.setProperty('--nx-delay', delay + 'ms');
      observer.observe(el);
    }

    var containers = doc.querySelectorAll('.post-block, .sidebar-inner, .footer-inner, .bento-hero');
    for (var i = 0; i < containers.length; i++) reveal(containers[i], 0);

    /* stagger the body content of the current article */
    var postBody = doc.querySelector('.main-inner.post .post-body');
    if (postBody) {
      var children = postBody.children;
      for (var c = 0; c < children.length && c < 14; c++) {
        reveal(children[c], Math.min(c * 55, 330));
      }
    }

    var lists = doc.querySelectorAll(
      '.tag-cloud, .category-all-page, .collection-title, .collection-year'
    );
    for (var l = 0; l < lists.length; l++) reveal(lists[l], 0);

    /* safety net: never leave the page invisible if the observer never fires */
    window.setTimeout(function () {
      var pending = doc.querySelectorAll('.nx-reveal:not(.nx-visible)');
      for (var p = 0; p < pending.length; p++) {
        var rect = pending[p].getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          pending[p].classList.add('nx-visible');
        }
      }
    }, 2500);
  }

  /* ---------------------------------------------------------------- search */

  function initSearch() {
    if (doc.querySelector('.nx-search-overlay')) return;

    var overlay = doc.createElement('div');
    overlay.className = 'nx-search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '站内搜索');

    var panel = doc.createElement('div');
    panel.className = 'nx-search-panel';

    var head = doc.createElement('div');
    head.className = 'nx-search-head';

    var icon = doc.createElement('span');
    icon.className = 'nx-search-icon';
    var iconI = doc.createElement('i');
    iconI.className = 'fa fa-search';
    iconI.setAttribute('aria-hidden', 'true');
    icon.appendChild(iconI);
    head.appendChild(icon);

    var inputWrap = doc.createElement('div');
    inputWrap.className = 'nx-search-input-wrap';
    var input = doc.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = '搜索文章…';
    input.autocomplete = 'off';
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', '搜索文章');
    inputWrap.appendChild(input);
    head.appendChild(inputWrap);

    var close = doc.createElement('button');
    close.type = 'button';
    close.className = 'nx-search-close';
    close.setAttribute('aria-label', '关闭搜索');
    var closeI = doc.createElement('i');
    closeI.className = 'fa fa-times';
    closeI.setAttribute('aria-hidden', 'true');
    close.appendChild(closeI);
    head.appendChild(close);

    var results = doc.createElement('div');
    results.className = 'nx-search-results';

    panel.appendChild(head);
    panel.appendChild(results);
    overlay.appendChild(panel);
    doc.body.appendChild(overlay);

    var data = null;
    var loading = false;
    var failed = false;

    function text(tag, className, value) {
      var el = doc.createElement(tag);
      if (className) el.className = className;
      if (value != null) el.textContent = value;
      return el;
    }

    function empty(message) {
      results.innerHTML = '';
      results.appendChild(text('p', 'nx-search-empty', message));
    }

    function highlight(parent, source, query) {
      if (!query) {
        parent.appendChild(doc.createTextNode(source));
        return;
      }
      var lower = source.toLowerCase();
      var q = query.toLowerCase();
      var at = 0;
      var found = lower.indexOf(q, at);
      while (found !== -1) {
        if (found > at) parent.appendChild(doc.createTextNode(source.slice(at, found)));
        var mark = doc.createElement('mark');
        mark.textContent = source.slice(found, found + q.length);
        parent.appendChild(mark);
        at = found + q.length;
        found = lower.indexOf(q, at);
      }
      if (at < source.length) parent.appendChild(doc.createTextNode(source.slice(at)));
    }

    function render(query) {
      if (failed) {
        empty('搜索索引加载失败，请刷新后重试。');
        return;
      }
      if (!data) {
        empty(loading ? '正在加载搜索索引…' : '正在准备搜索…');
        return;
      }
      var q = (query || '').trim().toLowerCase();
      var hits = [];
      for (var i = 0; i < data.length; i++) {
        var item = data[i] || {};
        var haystack = [item.title, item.content, item.categories, item.tags]
          .join(' ')
          .toLowerCase();
        if (!q || haystack.indexOf(q) !== -1) hits.push(item);
      }

      results.innerHTML = '';
      if (!hits.length) {
        empty('没有找到与「' + query.trim() + '」相关的文章。');
        return;
      }
      for (var h = 0; h < hits.length; h++) {
        var hit = hits[h];
        var link = doc.createElement('a');
        link.className = 'nx-search-result';
        link.href = hit.url || '#';
        var title = text('p', 'nx-r-title');
        highlight(title, hit.title || '未命名', query.trim());
        var meta = text(
          'p',
          'nx-r-meta',
          [hit.date, hit.categories].filter(Boolean).join(' · ')
        );
        link.appendChild(title);
        link.appendChild(meta);
        results.appendChild(link);
      }
    }

    function load() {
      if (data || loading) return;
      loading = true;
      render(input.value);
      fetch('/search.json', { credentials: 'same-origin' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (json) {
          data = Array.isArray(json) ? json : [];
          loading = false;
          render(input.value);
        })
        .catch(function () {
          loading = false;
          failed = true;
          render(input.value);
        });
    }

    var lastFocus = null;

    function open() {
      lastFocus = doc.activeElement;
      overlay.classList.add('is-open');
      doc.body.classList.add('nx-search-locked');
      load();
      render(input.value);
      window.setTimeout(function () {
        input.focus();
        input.select();
      }, 20);
    }

    function closeOverlay() {
      overlay.classList.remove('is-open');
      doc.body.classList.remove('nx-search-locked');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    var triggers = doc.querySelectorAll('.popup-trigger');
    for (var t = 0; t < triggers.length; t++) {
      /* the built theme ships the search trigger as an empty circle */
      if (!triggers[t].querySelector('i, svg')) {
        var searchIcon = doc.createElement('i');
        searchIcon.className = 'fa fa-search';
        searchIcon.setAttribute('aria-hidden', 'true');
        triggers[t].appendChild(searchIcon);
      }
      triggers[t].addEventListener('click', function (event) {
        event.preventDefault();
        open();
      });
    }

    close.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeOverlay();
    });

    input.addEventListener('input', function () {
      render(input.value);
    });

    doc.addEventListener('keydown', function (event) {
      var key = event.key ? event.key.toLowerCase() : '';
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        if (overlay.classList.contains('is-open')) closeOverlay();
        else open();
        return;
      }
      if (key === 'escape' && overlay.classList.contains('is-open')) {
        closeOverlay();
      }
    });
  }

  /* ----------------------------------------------------------------- boot */

  ready(function () {
    doc.documentElement.classList.add('nx-2026');
    injectLayers();
    initHeader();
    initHome();
    initReveal();
    initSearch();
  });
})();
