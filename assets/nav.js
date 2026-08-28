/* 상단 메뉴 / 서브탭 라우팅. 콘텐츠 데이터는 content.js 에서 가져온다. */
(function () {
  'use strict';

  var SECTIONS = (window.SITE_CONTENT && window.SITE_CONTENT.sections) || [];

  var el = {
    mainNav: document.getElementById('main-nav'),
    subNav: document.getElementById('sub-nav-content'),
    wodTabs: document.getElementById('tabs'),
    pageContent: document.getElementById('page-content'),
    pageLeaderboard: document.getElementById('page-leaderboard'),
    contentBody: document.getElementById('content-body')
  };

  var state = { section: null, subtab: null };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findSection(id) {
    return SECTIONS.filter(function (s) { return s.id === id; })[0];
  }

  function renderMainNav() {
    el.mainNav.innerHTML = SECTIONS.map(function (s) {
      return '<button class="tab mainnav-tab" role="tab" data-section="' + esc(s.id) +
        '" aria-selected="' + (state.section === s.id) + '">' + esc(s.label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(el.mainNav.children, function (b) {
      b.addEventListener('click', function () { goSection(b.dataset.section); });
    });
  }

  function renderSubNav(section) {
    if (section.id === 'leaderboard') {
      el.subNav.hidden = true;
      el.wodTabs.hidden = false;
      return;
    }
    el.wodTabs.hidden = true;
    var subtabs = section.subtabs || [];
    if (subtabs.length <= 1) {
      el.subNav.hidden = true;
      return;
    }
    el.subNav.hidden = false;
    el.subNav.innerHTML = subtabs.map(function (t) {
      return '<button class="tab" role="tab" data-subtab="' + esc(t.id) +
        '" aria-selected="' + (state.subtab === t.id) + '">' + esc(t.label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(el.subNav.children, function (b) {
      b.addEventListener('click', function () { goSubtab(b.dataset.subtab); });
    });
  }

  function renderContent() {
    var section = findSection(state.section);
    if (!section || section.id === 'leaderboard') return;
    var subtabs = section.subtabs || [];
    var tab = subtabs.filter(function (t) { return t.id === state.subtab; })[0] || subtabs[0];
    el.contentBody.innerHTML = tab
      ? '<article class="content-page"><h2>' + esc(tab.title || tab.label) + '</h2>' + (tab.body || '') + '</article>'
      : '';
  }

  function showPage() {
    var isLB = state.section === 'leaderboard';
    el.pageContent.hidden = isLB;
    el.pageLeaderboard.hidden = !isLB;
  }

  function goSection(id) {
    var section = findSection(id);
    if (!section) return;
    state.section = id;
    state.subtab = (section.subtabs && section.subtabs[0]) ? section.subtabs[0].id : null;
    renderMainNav();
    renderSubNav(section);
    renderContent();
    showPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goSubtab(id) {
    state.subtab = id;
    renderSubNav(findSection(state.section));
    renderContent();
  }

  if (SECTIONS.length) goSection(SECTIONS[0].id);
})();
