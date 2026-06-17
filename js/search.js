(function(){
  'use strict';
  var overlay = document.querySelector('.search-pop-overlay');
  var popup = document.querySelector('.search-popup');
  var input = document.querySelector('.search-input');
  var container = document.querySelector('.search-result-container');
  var btnClose = document.querySelector('.popup-btn-close');
  var searchData = [];
  var fetched = false;

  async function fetchData() {
    if (fetched) return;
    try {
      var resp = await fetch('/search.json');
      searchData = await resp.json();
      fetched = true;
    } catch(e) {}
  }

  function escRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, kw) {
    return text.replace(new RegExp('(' + escRegex(kw) + ')', 'gi'), '<mark style="background:rgba(124,58,237,0.2);color:#7c3aed;border-radius:2px;padding:0 2px;">$1</mark>');
  }

  function doSearch(q) {
    if (!q.trim()) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#d1d5db;"><i class="fa fa-search fa-3x"></i></div>';
      return;
    }
    var kws = q.trim().toLowerCase().split(/\s+/);
    var results = [];
    for (var i = 0; i < searchData.length; i++) {
      var item = searchData[i];
      var text = (item.title + ' ' + item.content + ' ' + (item.tags||'') + ' ' + (item.categories||'')).toLowerCase();
      var score = 0;
      for (var j = 0; j < kws.length; j++) {
        var kw = kws[j];
        var rre = new RegExp(escRegex(kw), 'gi');
        var matches = text.match(rre);
        if (matches) score += matches.length;
      }
      if (score > 0) results.push({title: item.title, url: item.url, date: item.date, categories: item.categories, score: score});
    }
    results.sort(function(a,b) { return b.score - a.score; });
    if (!results.length) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#d1d5db;"><i class="far fa-frown fa-3x"></i><p style="margin-top:10px;">没有找到相关结果</p></div>';
      return;
    }
    var html = '<p style="color:#9ca3af;font-size:13px;margin-bottom:10px;">找到 ' + results.length + ' 个结果</p>';
    for (var k = 0; k < results.length; k++) {
      var r = results[k];
      html += '<a href="' + r.url + '" style="display:block;padding:14px 16px;margin-bottom:8px;background:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.4);border-radius:12px;text-decoration:none;transition:all 0.2s;"><div style="font-weight:600;color:#1e1b4b;margin-bottom:4px;">' + highlight(r.title, q) + '</div><div style="font-size:13px;color:#9ca3af;">' + (r.date||'') + ' · ' + (r.categories||'') + '</div></a>';
    }
    container.innerHTML = html;
    var as = container.querySelectorAll('a');
    for (var m = 0; m < as.length; m++) {
      as[m].addEventListener('mouseenter', function() { this.style.background = 'rgba(255,255,255,0.65)'; });
      as[m].addEventListener('mouseleave', function() { this.style.background = 'rgba(255,255,255,0.4)'; });
    }
  }

  function open() {
    overlay.style.display = 'block';
    popup.style.display = 'block';
    setTimeout(function() { input.focus(); fetchData(); }, 200);
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.style.display = 'none';
    popup.style.display = 'none';
    document.body.style.overflow = '';
    input.value = '';
    doSearch('');
  }

  var triggers = document.querySelectorAll('.popup-trigger');
  for (var t = 0; t < triggers.length; t++) {
    triggers[t].addEventListener('click', open);
  }
  btnClose.addEventListener('click', close);
  overlay.addEventListener('click', close);
  input.addEventListener('input', function() { doSearch(input.value); });
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey||e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });
})();
