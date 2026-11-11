/* gk: practice quiz (multiple choice), flash cards, hide/show answers, search over every question, daily quiz with a streak */
(function () {
  'use strict';
  var d = document, SYG = window.SYG, esc = SYG.esc;
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, R) { R = R || Math.random; a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function get(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function dayNo() { var n = new Date(); return Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 864e5); }

  /* ---------- quiz box ---------- */
  var box = d.querySelector('[data-quiz]');
  function run(qs, opt) {
    /* opt: {title, key (best score), cards (flash cards only), daily} */
    var i = 0, score = 0, wrong = [], stage = box.querySelector('[data-stage]');
    function done() {
      var n = qs.length, msg = score === n ? 'Perfect score. Well done!' : score >= n * .7 ? 'Good work. Revise the ones you missed.' : (opt.key ? 'Keep practising. Read the list below and try again.' : 'Keep practising. Study the topics one by one and try again.');
      var extra = '';
      if (opt.key) { var best = get(opt.key, 0); if (score > best) { set(opt.key, score); best = score; } extra += '<p class="hint">Your best in this browser: ' + best + ' out of ' + n + '</p>'; }
      if (opt.daily) {
        var st = get('gk-streak', { d: 0, n: 0 }), today = dayNo();
        if (st.d !== today) { st.n = st.d === today - 1 ? st.n + 1 : 1; st.d = today; set('gk-streak', st); }
        set('gk-daily', { d: today, s: score, n: n });
        extra += '<p class="hint">Daily quiz streak: <b>' + st.n + (st.n === 1 ? ' day' : ' days') + '</b>. Come back tomorrow for a new set.</p>';
      }
      var share = 'I scored ' + score + ' out of ' + n + ' in ' + opt.title + '. Can you beat me? ' + location.origin + location.pathname;
      stage.innerHTML = '<div class="rise"><p class="big">' + score + ' / ' + n + '</p><p>' + msg + '</p>' + extra +
        (wrong.length ? '<details><summary>Questions you missed (' + wrong.length + ')</summary><ol class="qa">' + wrong.map(function (q) { return '<li><span class="q">' + esc(q.q) + '</span> <b class="ans">' + esc(q.a) + '</b>' + (q.n ? ' <small>' + esc(q.n) + '</small>' : '') + '</li>'; }).join('') + '</ol></details>' : '') +
        '<div class="acts"><button class="btn" type="button" data-again>' + (opt.daily ? 'Practise a random mix' : 'Try again') + '</button><button class="btn ghost" type="button" data-wa="' + esc(share) + '">Share score on WhatsApp</button></div></div>';
      stage.querySelector('[data-again]').onclick = function () { opt.again(); };
    }
    function show() {
      if (i >= qs.length) return done();
      var q = qs[i], head = '<p class="hint">Question ' + (i + 1) + ' of ' + qs.length + (opt.cards ? '' : ' · Score ' + score) + '</p><p class="qq">' + esc(q.q) + '</p>';
      if (opt.cards || !q.o) {
        stage.innerHTML = '<div class="rise">' + head + '<div data-ans hidden><p class="aa">' + esc(q.a) + '</p>' + (q.n ? '<p class="hint">' + esc(q.n) + '</p>' : '') + '</div>' +
          '<div class="acts"><button class="btn" type="button" data-rev>Show answer</button><button class="btn ghost" type="button" data-knew hidden>I knew it</button><button class="btn ghost" type="button" data-miss hidden>I did not know</button></div></div>';
        stage.querySelector('[data-rev]').onclick = function () { stage.querySelector('[data-ans]').hidden = false; this.hidden = true; stage.querySelector('[data-knew]').hidden = false; stage.querySelector('[data-miss]').hidden = false; };
        stage.querySelector('[data-knew]').onclick = function () { score++; i++; show(); };
        stage.querySelector('[data-miss]').onclick = function () { wrong.push(q); i++; show(); };
        return;
      }
      var opts = shuffle([q.a].concat(q.o));
      stage.innerHTML = '<div class="rise">' + head + '<div class="opts">' + opts.map(function (o) { return '<button type="button" class="opt">' + esc(o) + '</button>'; }).join('') + '</div><div data-fb></div></div>';
      stage.querySelectorAll('.opt').forEach(function (b) {
        b.onclick = function () {
          var ok = b.textContent === q.a;
          stage.querySelectorAll('.opt').forEach(function (x) { x.disabled = true; if (x.textContent === q.a) x.classList.add('right'); });
          if (ok) score++; else { b.classList.add('wrong'); wrong.push(q); }
          stage.querySelector('[data-fb]').innerHTML = '<p class="fb ' + (ok ? 'ok' : 'no') + '" role="status">' + (ok ? 'Correct!' : 'The answer is ' + esc(q.a) + '.') + (q.n ? ' ' + esc(q.n) : '') + '</p><div class="acts"><button class="btn" type="button" data-next>' + (i + 1 < qs.length ? 'Next question' : 'See my score') + '</button></div>';
          var nx = stage.querySelector('[data-next]'); nx.onclick = function () { i++; show(); }; nx.focus();
        };
      });
    }
    show();
    box.scrollIntoView({ block: 'nearest' });
  }

  if (box) {
    var el = d.getElementById('gk-data');
    if (el) { /* a topic page */
      var all = JSON.parse(el.textContent), slug = box.getAttribute('data-quiz'), title = box.getAttribute('data-title');
      var mcq = all.filter(function (q) { return q.o; });
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-start]'); if (!b) return;
        var mode = b.getAttribute('data-start');
        if (mode === 'quiz') (function go() { run(shuffle(mcq).slice(0, 10), { title: 'the ' + title + ' quiz', key: 'gk-best-' + slug, again: go }); })();
        else (function go() { run(shuffle(all), { title: title + ' flash cards', cards: true, again: go }); })();
      });
    } else { /* the quiz page: today's set (the same for everyone) and a random mix */
      SYG.json('/data/all.json').then(function (all) {
        var mcq = all.filter(function (q) { return q.o; });
        function mix() { run(shuffle(mcq).slice(0, 15), { title: 'a mixed GK quiz', again: mix }); }
        function daily() { run(shuffle(mcq, rng(dayNo())).slice(0, 10), { title: 'today\'s GK quiz', daily: true, again: mix }); }
        var last = get('gk-daily', null), st = get('gk-streak', { d: 0, n: 0 }), info = d.querySelector('[data-daily-info]');
        if (info) {
          if (last && last.d === dayNo()) info.textContent = 'You have done today\'s quiz: ' + last.s + ' out of ' + last.n + '. Streak: ' + st.n + (st.n === 1 ? ' day.' : ' days.') + ' You can do it again or try a random mix.';
          else if (st.n && st.d === dayNo() - 1) info.textContent = 'Your streak is ' + st.n + (st.n === 1 ? ' day' : ' days') + '. Do today\'s quiz to keep it going.';
        }
        d.addEventListener('click', function (e) { var b = e.target.closest('[data-start]'); if (!b) return; if (b.getAttribute('data-start') === 'daily') daily(); else mix(); });
        box.querySelectorAll('[data-start]').forEach(function (b) { b.disabled = false; });
      }).catch(function () { box.querySelector('[data-stage]').innerHTML = '<p>The questions could not be loaded. Please check your connection and reload the page.</p>'; });
    }
  }

  /* ---------- hide / show answers in the study list ---------- */
  var tog = d.querySelector('[data-hide]'), list = d.querySelector('ol.qa.study');
  if (tog && list) {
    tog.addEventListener('click', function () {
      var on = list.classList.toggle('hidden-ans'); tog.textContent = on ? 'Show all answers' : 'Hide answers to test yourself';
      list.querySelectorAll('li').forEach(function (li) { li.classList.remove('open'); });
    });
    list.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li && list.classList.contains('hidden-ans')) li.classList.toggle('open'); });
  }
  var pr = d.querySelector('[data-print]'); if (pr) pr.addEventListener('click', function () { window.print(); });

  /* ---------- search over every question (home page) ---------- */
  var q = d.querySelector('[data-search]');
  if (q) {
    var data = null, out = d.querySelector('[data-results]'), timer;
    function find() {
      var words = q.value.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
      if (!words.length) { out.innerHTML = ''; return; }
      var hits = data.filter(function (x) { var s = (x.q + ' ' + x.a + ' ' + x.t).toLowerCase(); return words.every(function (w) { return s.indexOf(w) > -1; }); }).slice(0, 25);
      out.innerHTML = hits.length ? '<ol class="qa">' + hits.map(function (x) { return '<li><span class="q">' + esc(x.q) + '</span> <b class="ans">' + esc(x.a) + '</b> <small><a href="/' + x.s + '/">' + esc(x.t) + '</a></small></li>'; }).join('') + '</ol>'
        : '<p class="hint">No question matches. Try one word, such as "capital", "river" or "first".</p>';
    }
    q.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (data) find(); else SYG.json('/data/all.json').then(function (j) { data = j; find(); }).catch(function () { out.innerHTML = '<p class="hint">Search could not load. Please reload the page.</p>'; }); }, 150);
    });
  }
})();
