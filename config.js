/* ============================================================
   대회 설정 파일 — 여기만 수정하면 됩니다.
   ============================================================ */
window.LEADERBOARD_CONFIG = {
  /* 브라우저 탭 제목에 쓰일 대회 이름 (헤더 로고는 assets/images/title-logo.png) */
  title: "천하제일돕:Harvest",

  /* ------------------------------------------------------------
     구글 시트 "웹에 게시" CSV 주소.
     README.md 의 2단계를 따라 주소를 받아서 아래에 붙여넣으세요.
     비워두면 예시 데이터로 화면이 뜹니다. (배포 전 미리보기용)
     ------------------------------------------------------------ */
  sheetCsv: {
    wods:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7WCZFhOfBjPS_uU6SCWaP_7pXksczo42UnNIJHyBPqIh7HZ05ZcNW9et21IkxzgK5TN0NssJjmhAA/pub?gid=0&single=true&output=csv",   // info 탭 (wods)
    scores: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUUekg3PBuXOCuMtIIPoBLuUf55xvhg5BnzprrIL06hA-Sh317PhhzlqaUZJVCB-_19EhwTcnQ8Qkq/pub?gid=0&single=true&output=csv"    // leaderboard 탭 (scores)
  },

  /* 자동 새로고침 주기(초). 0 이면 자동 새로고침 끔 */
  refreshSeconds: 30,

  /* 동점 처리 방식
     "average" : 공동 2위가 2명이면 둘 다 2.5점 (합계가 공평함, 권장)
     "min"     : 공동 2위가 2명이면 둘 다 2점, 다음은 4위             */
  tieMode: "average",

  /* 총점이 같을 때 순위를 가르는 기준
     "best" : 더 좋은 등수를 많이 가진 팀이 상위 (크로스핏 표준)
     "none" : 공동 순위로 그대로 표시                                */
  overallTiebreak: "best"
};
