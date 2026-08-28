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
      label: "Competition Info",
      subtabs: [
        {
          id: "timetable",
          label: "Time table",
          title: "Time table",
          body: `
            <div class="img-placeholder"><span class="ico">🗓️</span>타임테이블 이미지 준비 중</div>
            <p>대회 당일 진행 순서와 시간이 이곳에 안내될 예정입니다.</p>
          `
        },
        {
          id: "regulations",
          label: "Regulations",
          title: "Regulations",
          body: `
            <div class="img-placeholder"><span class="ico">📋</span>안내 이미지 준비 중</div>
            <p>박스 내 주차, 짐 보관, 관중석 등 이용 수칙이 이곳에 안내될 예정입니다.</p>
          `
        },
        {
          id: "usedmarket",
          label: "Used market",
          title: "Used market",
          body: `
            <div class="img-placeholder"><span class="ico">🛍️</span>안내 이미지 준비 중</div>
            <p>바자회(중고 마켓) 운영 시간과 위치가 이곳에 안내될 예정입니다.</p>
          `
        },
        {
          id: "bestdresser",
          label: "Best Dresser",
          title: "Best Dresser",
          body: `
            <div class="img-placeholder"><span class="ico">👕</span>안내 이미지 준비 중</div>
            <p>베스트 드레서 선정 방식과 투표 방법이 이곳에 안내될 예정입니다.</p>
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
            <div class="img-placeholder"><span class="ico">📖</span>와드 상세 이미지/문서 준비 중</div>
            <p>Event 1 와드 내용과 진행 규정이 이곳에 안내될 예정입니다.</p>
          `
        },
        {
          id: "event2",
          label: "Event2",
          title: "Event 2",
          body: `
            <div class="img-placeholder"><span class="ico">📖</span>와드 상세 이미지/문서 준비 중</div>
            <p>Event 2 와드 내용과 진행 규정이 이곳에 안내될 예정입니다.</p>
          `
        },
        {
          id: "event3",
          label: "Event3",
          title: "Event 3",
          body: `
            <div class="img-placeholder"><span class="ico">📖</span>와드 상세 이미지/문서 준비 중</div>
            <p>Event 3 와드 내용과 진행 규정이 이곳에 안내될 예정입니다.</p>
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
