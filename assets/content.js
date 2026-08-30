/* ============================================================
   Competition Info / WOD & RULE 콘텐츠.
   문구를 받으면 아래 body(HTML) 안의 안내 문구만 교체하면 됩니다.
   이미지는 assets/images/ 폴더에 넣고
   <img src="assets/images/파일명.jpg"> 로 img-placeholder 자리를 바꾸면 됩니다.
   ============================================================ */
window.SITE_CONTENT = {
  sections: [
    {
      id: "info",
      label: "Notice",
      subtabs: [
        {
          id: "timetable",
          label: "Time table",
          title: "Time table",
          body: `
            <img src="assets/images/timetable.jpg" alt="Time table">
            <img src="assets/images/heat-table.jpg" alt="Heat table">
          `
        },
        {
          id: "regulations",
          label: "Regulations",
          title: "Regulations",
          body: `
            <img src="assets/images/regulations-box.jpg" alt="박스 이용 관련">
            <img src="assets/images/regulations-competition.jpg" alt="대회 관련">
            <img src="assets/images/regulations-afterparty.jpg" alt="뒤풀이 관련">
          `
        },
        {
          id: "usedmarket",
          label: "Used market",
          title: "Used market",
          body: `
            <img src="assets/images/notice-bazaar.jpg" alt="바자회 관련">
          `
        },
        {
          id: "bestdresser",
          label: "Best Dresser",
          title: "Best Dresser",
          body: `
            <img src="assets/images/notice-bestdresser.jpg" alt="베스트 드레서 상 안내">
          `
        }
      ]
    },
    {
      id: "wodrule",
      label: "WOD & RULE",
      subtabs: [
        {
          id: "event1",
          label: "Event1",
          title: "Event 1",
          body: `
            <img src="assets/images/event1.jpg" alt="Event 1">
            <img src="assets/images/event1-rulebook.jpg" alt="Event 1 Rulebook">
          `
        },
        {
          id: "event2",
          label: "Event2",
          title: "Event 2",
          body: `
            <img src="assets/images/event2.jpg" alt="Event 2">
            <img src="assets/images/event2-rulebook.jpg" alt="Event 2 Rulebook">
          `
        },
        {
          id: "event3",
          label: "Event3",
          title: "Event 3",
          body: `
            <img src="assets/images/event3.jpg" alt="Event 3">
            <img src="assets/images/event3-rulebook.jpg" alt="Event 3 Rulebook">
          `
        }
      ]
    },
    {
      id: "leaderboard",
      label: "Leader board"
      /* 서브탭 없음 — 리더보드 화면(app.js)이 Overall / E1 / E2 / E3 / F 탭을 자체적으로 그립니다. */
    }
  ]
};
