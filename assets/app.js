/* UNDER SKY 리더보드 — 구글 시트 CSV를 읽어 순위를 계산한다.
   서버 없음 / 빌드 없음 / 정적 파일만으로 동작. */
(function () {
  'use strict';

  var CFG = window.LEADERBOARD_CONFIG || {};
  var TIE_AVG = (CFG.tieMode || 'average') !== 'min';

  var el = {
    statusText: document.getElementById('status-text'),
    dot: document.getElementById('live-dot'),
    refresh: document.getElementById('refresh'),
    tabs: document.getElementById('tabs'),
    board: document.getElementById('board'),
    banner: document.getElementById('banner'),
    search: document.getElementById('search'),
    count: document.getElementById('count'),
    foot: document.getElementById('foot-note')
  };

  var state = { wods: [], teams: [], view: 'overall', query: '', demo: false };

  /* ================= CSV ================= */

  function parseCSV(text) {
    var rows = [], row = [], field = '', inQ = false, i = 0;
    text = String(text).replace(/^﻿/, '');
    while (i < text.length) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQ = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    row.push(field); rows.push(row);
    return rows.filter(function (r) {
      return r.some(function (v) { return String(v).trim() !== ''; });
    });
  }

  function toObjects(rows) {
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    return rows.slice(1).map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = String(r[i] == null ? '' : r[i]).trim(); });
      o.__cells = r;
      o.__head = head;
      return o;
    });
  }

  function pick(obj, names) {
    for (var i = 0; i < names.length; i++) {
      if (obj[names[i]] != null && obj[names[i]] !== '') return obj[names[i]];
    }
    return '';
  }

  /* ================= 기록 파싱 ================= */

  var DNF = { dnf: 1, dns: 1, 'n/a': 1, na: 1, '-': 1, x: 1, '기권': 1, '미출전': 1, '실격': 1 };

  // "12:34" / "1:02:33" / "9:59.5" / "754"(초) -> 초
  function parseTime(s) {
    var parts = s.split(':');
    if (parts.length > 3) return null;
    var total = 0;
    for (var i = 0; i < parts.length; i++) {
      var n = Number(String(parts[i]).replace(/[^\d.]/g, ''));
      if (isNaN(n)) return null;
      total = total * 60 + n;
    }
    return total;
  }

  function fmtTime(sec) {
    var neg = sec < 0; sec = Math.abs(sec);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var ss = (s < 10 ? '0' : '') + (Math.round(s * 10) % 10 === 0 ? Math.round(s) : s.toFixed(1));
    var out = h > 0 ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
    return (neg ? '-' : '') + out;
  }

  function parseNumber(s) {
    var n = Number(String(s).replace(/[^\d.\-]/g, ''));
    return isNaN(n) ? null : n;
  }

  // state: ok | cap | dnf | none
  function parseScore(raw, kind) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return { state: 'none', display: '—' };
    var low = s.toLowerCase();
    if (DNF[low]) return { state: 'dnf', display: s.toUpperCase() };

    if (kind === 'time') {
      var cap = low.match(/^cap\s*(?:\+\s*(\d+))?$/);
      if (cap) {
        var left = cap[1] ? Number(cap[1]) : 0;
        return { state: 'cap', value: left, display: cap[1] ? 'CAP+' + left : 'CAP' };
      }
      var t = parseTime(s);
      if (t == null) return { state: 'dnf', display: s };
      return { state: 'ok', value: t, display: fmtTime(t) };
    }

    var n = parseNumber(s);
    if (n == null) return { state: 'dnf', display: s };
    return { state: 'ok', value: n, display: s };
  }

  // 동점자 판정용 기록 (예: "13:23") — 항상 시간으로 해석, 빠를수록 상위
  function parseTieTime(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return null;
    var t = parseTime(s);
    if (t == null) return null;
    return { value: t, display: fmtTime(t) };
  }

  function higherIsBetter(kind) { return kind !== 'time'; }

  var KIND_LABEL = {
    time: '기록 (빠를수록 상위)',
    reps: '횟수 (많을수록 상위)',
    weight: '중량 (무거울수록 상위)',
    points: '점수 (높을수록 상위)',
    distance: '거리 (멀수록 상위)',
    calories: '칼로리 (높을수록 상위)'
  };

  function normKind(v) {
    var k = String(v || '').trim().toLowerCase();
    if (/time|시간|기록|for time|속도/.test(k)) return 'time';
    if (/rep|횟수|개수|amrap|round/.test(k)) return 'reps';
    if (/weight|중량|무게|kg|lb|1rm|max/.test(k)) return 'weight';
    if (/cal/.test(k) || /칼로리/.test(k)) return 'calories';
    if (/dist|거리|m$|미터/.test(k)) return 'distance';
    if (/point|점수|score/.test(k)) return 'points';
    return 'time';
  }

  /* ================= 순위 계산 ================= */

  function rankOne(entries, kind) {
    var hib = higherIsBetter(kind);
    var keyed = entries.map(function (e) {
      var sc = e.score, bucket, val;
      if (sc.state === 'ok') { bucket = 0; val = hib ? -sc.value : sc.value; }
      else if (sc.state === 'cap') { bucket = 1; val = sc.value; }
      else { bucket = 2; val = 0; }
      var tieVal = e.tie ? e.tie.value : null;
      return { team: e.team, score: sc, tie: e.tie, bucket: bucket, val: val, tieVal: tieVal, rank: 0 };
    });

    keyed.sort(function (a, b) {
      return (a.bucket - b.bucket) || (a.val - b.val) ||
             ((a.tieVal == null ? Infinity : a.tieVal) - (b.tieVal == null ? Infinity : b.tieVal)) ||
             a.team.name.localeCompare(b.team.name, 'ko');
    });

    var i = 0;
    while (i < keyed.length) {
      var j = i;
      while (j + 1 < keyed.length &&
             keyed[j + 1].bucket === keyed[i].bucket &&
             keyed[j + 1].val === keyed[i].val &&
             keyed[j + 1].tieVal === keyed[i].tieVal) j++;
      var r = TIE_AVG ? ((i + 1) + (j + 1)) / 2 : (i + 1);
      for (var k = i; k <= j; k++) keyed[k].rank = r;
      i = j + 1;
    }
    return keyed;
  }

  function compute() {
    var teams = state.teams, wods = state.wods;

    teams.forEach(function (t) { t.results = {}; t.total = 0; t.ranks = []; });

    wods.forEach(function (w) {
      var entries = teams.map(function (t) {
        return {
          team: t,
          score: parseScore(t.raw[w.id], w.kind),
          tie: parseTieTime(t.raw[w.id + '-tie'])
        };
      });
      var ranked = rankOne(entries, w.kind);
      w.ranked = ranked;
      w.scored = ranked.some(function (r) { return r.bucket < 2; });
      ranked.forEach(function (r) {
        r.team.results[w.id] = r;
        r.team.total += r.rank;
        r.team.ranks.push(r.rank);
      });
    });

    var sorted = teams.slice().sort(function (a, b) {
      if (a.total !== b.total) return a.total - b.total;
      if ((CFG.overallTiebreak || 'best') === 'best') {
        var A = a.ranks.slice().sort(function (x, y) { return x - y; });
        var B = b.ranks.slice().sort(function (x, y) { return x - y; });
        for (var i = 0; i < Math.min(A.length, B.length); i++) {
          if (A[i] !== B[i]) return A[i] - B[i];
        }
      }
      return a.name.localeCompare(b.name, 'ko');
    });

    var pos = 0, prev = null, prevKey = null;
    sorted.forEach(function (t, i) {
      var key = (CFG.overallTiebreak || 'best') === 'best'
        ? i // 타이브레이크를 쓰면 공동순위 없음
        : t.total;
      if (prevKey === null || key !== prevKey) { pos = i + 1; }
      t.pos = pos; t.tied = (prevKey !== null && key === prevKey);
      if (t.tied && prev) prev.tied = true;
      prev = t; prevKey = key;
    });

    state.sorted = sorted;
  }

  /* ================= 렌더 ================= */

  function fmtRank(r) {
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function matches(t) {
    if (!state.query) return true;
    var q = state.query.toLowerCase();
    return t.name.toLowerCase().indexOf(q) >= 0 ||
           String(t.members || '').toLowerCase().indexOf(q) >= 0;
  }

  function renderTabs() {
    var html = '<button class="tab" role="tab" data-view="overall" aria-selected="' +
      (state.view === 'overall') + '">Overall</button>';
    state.wods.forEach(function (w) {
      html += '<button class="tab" role="tab" data-view="' + esc(w.id) + '" aria-selected="' +
        (state.view === w.id) + '">' + esc(w.short || w.name) + '</button>';
    });
    el.tabs.innerHTML = html;
    Array.prototype.forEach.call(el.tabs.children, function (b) {
      b.addEventListener('click', function () {
        state.view = b.dataset.view;
        renderTabs(); renderBoard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function medalClass(pos) {
    return pos === 1 ? ' top1' : pos === 2 ? ' top2' : pos === 3 ? ' top3' : '';
  }

  function renderOverall() {
    var list = state.sorted.filter(matches);
    el.count.textContent = list.length + ' / ' + state.teams.length + '팀';
    if (!list.length) return '<div class="empty">해당하는 팀이 없습니다.</div>';

    return list.map(function (t) {
      var chips = state.wods.map(function (w) {
        var r = t.results[w.id];
        var pending = r.bucket === 2;
        var cls = 'chip' + (pending ? ' pending' : (r.rank === 1 ? ' best' : ''));
        return '<span class="' + cls + '">' + esc(w.short || w.name) +
               ' <b>' + (pending ? '—' : fmtRank(r.rank)) + '</b></span>';
      }).join('');

      return '<div class="row' + medalClass(t.pos) + '">' +
        '<div class="pos">' + (t.tied ? 'T' : '') + t.pos + '</div>' +
        '<div class="info">' +
          '<div class="team">' + esc(t.name) + '</div>' +
          (t.members ? '<div class="members">' + esc(t.members) + '</div>' : '') +
          '<div class="chips">' + chips + '</div>' +
        '</div>' +
        '<div class="score"><span class="val">' + fmtRank(t.total) +
          '</span><span class="lbl">총점</span></div>' +
      '</div>';
    }).join('');
  }

  function renderWod(w) {
    var list = w.ranked.filter(function (r) { return matches(r.team); });
    el.count.textContent = list.length + ' / ' + state.teams.length + '팀';

    var head = '<div class="wodhead"><h2>' + esc(w.name) + '</h2>' +
      '<span class="kind">' + (KIND_LABEL[w.kind] || w.kind) + '</span></div>';

    if (!w.scored) {
      return head + '<div class="empty">아직 기록이 등록되지 않았습니다.</div>';
    }
    if (!list.length) return head + '<div class="empty">해당하는 팀이 없습니다.</div>';

    return head + list.map(function (r) {
      var pending = r.bucket === 2;
      var pos = pending ? '—' : fmtRank(r.rank);
      var tieHtml = (r.tie && r.tie.display)
        ? ' <span class="tie-note">(' + esc(r.tie.display) + ')</span>' : '';
      return '<div class="row' + (pending ? '' : medalClass(Math.round(r.rank))) + '">' +
        '<div class="pos">' + pos + '</div>' +
        '<div class="info"><div class="team">' + esc(r.team.name) + '</div>' +
          (r.team.members ? '<div class="members">' + esc(r.team.members) + '</div>' : '') +
        '</div>' +
        '<div class="score"><span class="val' + (pending ? ' dim' : '') + '">' +
          esc(r.score.display) + tieHtml + '</span><span class="lbl">기록</span></div>' +
      '</div>';
    }).join('');
  }

  function renderBoard() {
    if (!state.teams.length) {
      el.board.innerHTML = '<div class="empty">등록된 팀이 없습니다.</div>';
      el.count.textContent = '';
      return;
    }
    if (state.view === 'overall') { el.board.innerHTML = renderOverall(); return; }
    var w = state.wods.filter(function (x) { return x.id === state.view; })[0];
    el.board.innerHTML = w ? renderWod(w) : renderOverall();
  }

  function renderAll() {
    document.title = (CFG.title || 'LEADERBOARD') + ' 리더보드';
    if (state.wods.every(function (w) { return w.id !== state.view; }) && state.view !== 'overall') {
      state.view = 'overall';
    }
    renderTabs();
    renderBoard();
    var done = state.wods.filter(function (w) { return w.scored; }).length;
    el.foot.textContent = state.teams.length + '팀 · ' + state.wods.length + '개 종목 · ' +
      done + '개 종목 집계 완료';
  }

  /* ================= 데이터 로드 ================= */

  function bust(url) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + '_ts=' + Date.now();
  }

  function fetchCSV(url) {
    return fetch(bust(url), { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(parseCSV);
  }

  function buildWods(rows) {
    return toObjects(rows).map(function (o, i) {
      var id = pick(o, ['id', '아이디', 'key', 'wod']) || ('wod' + (i + 1));
      var name = pick(o, ['name', '이름', '종목', 'title']) || id;
      var hidden = /^(y|yes|true|1|숨김|비공개)$/i.test(pick(o, ['hidden', '숨김', '비공개']));
      return {
        id: id,
        name: name,
        short: pick(o, ['short', '약칭', '표시']) || id.toUpperCase(),
        kind: normKind(pick(o, ['type', 'kind', '타입', '유형', '측정'])),
        note: pick(o, ['note', '설명', '메모', 'desc']),
        hidden: hidden
      };
    }).filter(function (w) { return !w.hidden; });
  }

  function buildTeams(rows, wods) {
    var objs = toObjects(rows);
    return objs.map(function (o) {
      var name = pick(o, ['team', '팀', '팀명', '팀이름', 'name']);
      if (!name) return null;
      var raw = {};
      wods.forEach(function (w) {
        raw[w.id] = o[w.id.toLowerCase()] != null ? o[w.id.toLowerCase()] : '';
        var tieCol = (w.id + '-tie').toLowerCase();
        raw[w.id + '-tie'] = o[tieCol] != null ? o[tieCol] : '';
      });
      return {
        name: name,
        members: pick(o, ['members', '멤버', '선수', '구성원', '팀원']),
        raw: raw
      };
    }).filter(Boolean);
  }

  function setStatus(text, cls) {
    el.statusText.textContent = text;
    el.dot.className = 'dot' + (cls ? ' ' + cls : '');
  }

  function showBanner(html) {
    el.banner.innerHTML = html;
    el.banner.hidden = false;
  }

  function load(manual) {
    var urls = CFG.sheetCsv || {};
    if (!urls.wods || !urls.scores) {
      loadDemo();
      return Promise.resolve();
    }
    if (manual) el.refresh.classList.add('spin');
    setStatus('불러오는 중…');

    return Promise.all([fetchCSV(urls.wods), fetchCSV(urls.scores)])
      .then(function (res) {
        var wods = buildWods(res[0]);
        var teams = buildTeams(res[1], wods);
        if (!wods.length) throw new Error('wods 시트에 종목이 없습니다');
        state.wods = wods;
        state.teams = teams;
        state.demo = false;
        el.banner.hidden = true;
        compute();
        renderAll();
        setStatus('업데이트 ' + new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }), 'live');
      })
      .catch(function (err) {
        setStatus('불러오기 실패 — ' + err.message, 'err');
        if (!state.teams.length) {
          showBanner('구글 시트를 불러오지 못했습니다. <code>config.js</code> 의 CSV 주소와, ' +
            '시트가 <b>파일 → 공유 → 웹에 게시</b> 되어 있는지 확인하세요.');
          el.board.innerHTML = '<div class="empty">데이터를 불러올 수 없습니다.</div>';
        }
      })
      .then(function () { el.refresh.classList.remove('spin'); });
  }

  /* ================= 예시 데이터 ================= */

  function loadDemo() {
    state.demo = true;
    var names = ['호랑이', '불꽃', '강철', '천둥', '해적단', '질풍', '검은늑대', '태양',
      '북극성', '용광로', '파도', '사자후', '번개', '설산', '유령', '거인',
      '독수리', '화산', '심연', '코브라', '폭풍', '기린', '메테오', '방패'];
    var wods = [
      { id: 'e1-1', name: 'Event 1-1', short: 'E1-1', kind: 'time', note: 'Event 1-1 와드 내용 및 타임캡을 여기에 입력' },
      { id: 'e1-2', name: 'Event 1-2', short: 'E1-2', kind: 'time', note: 'Event 1-2 와드 내용 및 타임캡을 여기에 입력' },
      { id: 'e2-1', name: 'Event 2-1', short: 'E2-1', kind: 'weight', note: 'Event 2-1 와드 내용을 여기에 입력' },
      { id: 'e2-2', name: 'Event 2-2', short: 'E2-2', kind: 'weight', note: 'Event 2-2 와드 내용을 여기에 입력' },
      { id: 'e3', name: 'Event 3', short: 'E3', kind: 'reps', note: 'Event 3 와드 내용을 여기에 입력' }
    ];
    var seed = 7;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

    state.wods = wods;
    state.teams = names.map(function (n, i) {
      var raw = {};
      raw['e1-1'] = rnd() < .12 ? 'CAP+' + Math.floor(rnd() * 30 + 1)
        : fmtTime(Math.round(300 + rnd() * 400));
      raw['e1-2'] = rnd() < .12 ? 'CAP+' + Math.floor(rnd() * 30 + 1)
        : fmtTime(Math.round(300 + rnd() * 400));
      raw['e2-1'] = String(Math.round(260 + rnd() * 140));
      raw['e2-2'] = String(Math.round(260 + rnd() * 140));
      raw['e3'] = String(Math.round(210 + rnd() * 130));
      return { name: n + ' 크루', members: '선수 3명', raw: raw };
    });

    compute();
    renderAll();
    setStatus('예시 데이터 (구글 시트 미연결)');
    showBanner('지금 보이는 건 <b>예시 데이터</b>입니다. <code>config.js</code> 에 구글 시트 ' +
      'CSV 주소 두 개를 넣으면 실제 기록으로 바뀝니다. 설정 방법은 <code>README.md</code> 참고.');
  }

  /* ================= 시작 ================= */

  el.refresh.addEventListener('click', function () {
    if (state.demo) { loadDemo(); return; }
    load(true);
  });

  var timer;
  el.search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      state.query = el.search.value.trim();
      renderBoard();
    }, 120);
  });

  load();

  var sec = Number(CFG.refreshSeconds || 0);
  if (sec > 0) {
    setInterval(function () {
      if (!state.demo && document.visibilityState === 'visible') load();
    }, sec * 1000);
  }
})();
