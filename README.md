# UNDER SKY 리더보드

크로스핏 팀 대항전(3인 1팀 · 24팀) 공개 리더보드.
**서버 없음 · 데이터베이스 없음 · 유지비 0원.**

- 운영진은 **구글 시트**에 기록만 입력합니다.
- 관중은 **공개 링크** 하나만 열면 순위가 보입니다. (30초마다 자동 갱신)
- 순위 계산(WOD별 등수 → 합산)은 브라우저가 알아서 합니다.

## 메뉴 구조

| 메인 메뉴 | 하위 메뉴 |
|---|---|
| **Competition Info** | Time table · Regulations · Used market · Best Dresser |
| **WOD & RULE** | Event1 · Event2 · Event3 |
| **Leader board** | Overall · E1 · E2 · E3 · F |

- 메인 메뉴 선택 색상은 **주황**, 하위 메뉴 선택 색상은 **노랑**입니다. ([assets/style.css](assets/style.css) 에서 `--accent`, `--gold` 변수로 조절)
- Competition Info / WOD & RULE 의 문구·이미지는 [assets/content.js](assets/content.js) 에서 편집합니다.
- Leader board 의 하위 메뉴(Overall/E1/E2/E3/F)는 구글 시트의 `wods` 탭에서 자동으로 만들어집니다 — content.js 를 건드릴 필요 없습니다.
- `F`(Final)는 아직 진행 전이라 임시로 넣어둔 자리입니다. 결승을 안 한다면 `wods` 탭에서 그 줄을 지우면 탭에서도 사라집니다.

---

## 채점 규칙

- WOD별로 등수를 매기고, **모든 WOD의 등수를 더한 값이 낮은 팀이 상위**입니다.
- 동점자는 **평균 등수**를 받습니다. (공동 2위 2팀 → 둘 다 2.5점)
  - `config.js` 의 `tieMode: "min"` 으로 바꾸면 2점/2점/4위 방식이 됩니다.
- 총점이 같으면 **더 좋은 등수를 많이 가진 팀**이 상위입니다. (크로스핏 표준)
- 기록 미입력 / DNF 팀은 그 WOD의 **공동 꼴찌**로 처리됩니다.

---

## 1단계 — 구글 시트 만들기

구글 스프레드시트를 새로 만들고, **탭 2개**를 아래 이름으로 만듭니다.

| 탭 이름 | 역할 |
|---|---|
| `wods` | 종목 정의 |
| `scores` | 팀별 기록 입력 |

`sheets/wods.csv` 와 `sheets/scores.csv` 를 각 탭에 가져오면(파일 → 가져오기 → 업로드 →
"현재 시트 바꾸기") 형식이 그대로 세팅됩니다.

### `wods` 탭

| 열 | 설명 |
|---|---|
| `id` | 종목 식별자. **`scores` 탭의 열 이름과 반드시 같아야 합니다.** (영문 소문자 권장, 예: `event1`) |
| `name` | 화면에 표시될 종목 이름 (예: `Event 1`) |
| `short` | 리더보드 탭에 쓸 짧은 이름 (예: `E1`) |
| `type` | `time` / `reps` / `weight` / `distance` / `points` |
| `note` | 종목 설명 (와드 내용, 타임캡 등) |
| `hidden` | `y` 를 넣으면 사이트에서 감춰집니다. 아직 공개하기 전인 종목에 사용 |

`type` 이 `time` 이면 **빠를수록** 상위, 나머지는 **높을수록** 상위입니다.

### `scores` 탭

| 열 | 설명 |
|---|---|
| `team` | 팀 이름 (필수) |
| `members` | 팀원 이름. 비워도 됩니다 |
| `event1`, `event2`, … | `wods` 탭의 `id` 와 같은 이름의 열. 여기에 기록을 입력 |

**종목을 추가하려면** `wods` 탭에 줄을 하나 추가하고, `scores` 탭에 같은 이름의 열을
하나 추가하면 끝입니다. 코드는 건드리지 않아도 됩니다.

### 기록 입력 형식

| 종목 타입 | 입력 예시 | 의미 |
|---|---|---|
| `time` | `8:42` | 8분 42초 |
| `time` | `1:04:20` | 1시간 4분 20초 |
| `time` | `9:58.5` | 소수점 초 |
| `time` | `CAP+15` | 타임캡에 걸림, **남은 렙 15개** (적을수록 상위) |
| `time` | `CAP` | 타임캡, 남은 렙 미상 |
| `reps` / `weight` / `distance` | `247`, `315` | 숫자 |
| 공통 | `DNF`, `기권`, 빈칸 | 그 종목 공동 꼴찌 |

> 순서: **완주한 팀 → CAP 걸린 팀 → DNF·미입력 팀**

⚠️ 구글 시트가 `8:42` 를 시간 서식으로 바꿔버리면, 해당 열을 선택하고
**서식 → 숫자 → 일반 텍스트** 로 지정하세요. (또는 `'8:42` 처럼 앞에 작은따옴표)

---

## 2단계 — 시트를 CSV로 게시하기

구글 시트에서 **파일 → 공유 → 웹에 게시**

1. "링크" 탭 선택
2. 왼쪽 드롭다운에서 **`wods`** 탭 선택
3. 오른쪽 드롭다운에서 **쉼표로 구분된 값(.csv)** 선택
4. **게시** → 나오는 주소를 복사
5. 같은 방법으로 **`scores`** 탭 주소도 복사

주소는 이렇게 생겼습니다:

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vQ.../pub?gid=0&single=true&output=csv
```

두 주소를 `config.js` 에 붙여넣습니다:

```js
sheetCsv: {
  wods:   "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv",
  scores: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=12345&single=true&output=csv"
}
```

> 🔒 "웹에 게시"는 **읽기 전용 사본**을 공개하는 기능입니다. 관중은 시트를 수정할 수 없고,
> 편집 권한은 운영진에게만 남습니다. 게시된 CSV에 들어가는 내용만 공개되니
> 시트에 개인정보(연락처, 생년월일 등)는 넣지 마세요.

---

## 3단계 — GitHub Pages로 배포하기

1. [github.com](https://github.com) 가입 (무료)
2. **New repository** → 이름 `undersky-leaderboard` → **Public** → Create
3. 이 폴더의 파일 전부를 저장소에 올립니다.
   - 웹에서: **Add file → Upload files** 로 드래그 앤 드롭
   - 또는 터미널에서 아래 명령

   ```bash
   git init && git add -A && git commit -m "리더보드" && git branch -M main && git remote add origin https://github.com/<아이디>/undersky-leaderboard.git && git push -u origin main
   ```

4. 저장소 **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save
5. 1~2분 뒤 아래 주소가 열립니다. **이 링크를 참가자와 관중에게 공유하세요.**

   ```
   https://<아이디>.github.io/undersky-leaderboard/
   ```

기록을 수정하면 사이트를 다시 올릴 필요 없이 **구글 시트만 고치면** 반영됩니다.
(관중 화면은 30초마다 자동 갱신, 새로고침 버튼도 있습니다.)

---

## 비용

| 항목 | 비용 |
|---|---|
| 구글 시트 | 0원 |
| GitHub Pages 호스팅 · HTTPS · 트래픽 | 0원 |
| 도메인 | 0원 (`github.io` 주소 사용) |

원하면 나중에 개인 도메인(연 1~2만원)을 연결할 수 있지만, 필수는 아닙니다.

---

## 대회 당일 체크리스트

- [ ] `scores` 탭의 팀 이름 24개를 실제 팀명으로 교체
- [ ] `wods` 탭에 실제 종목·타임캡 입력
- [ ] 아직 공개 안 할 종목은 `hidden` 열에 `y`
- [ ] 기록 입력 담당자에게 시트 **편집 권한** 공유
- [ ] 기록 열의 셀 서식을 **일반 텍스트**로 지정 (시간 자동 변환 방지)
- [ ] 리더보드 링크를 QR 코드로 만들어 현장에 부착
- [ ] 현장 와이파이에서 링크가 열리는지 미리 확인

---

## 파일 구조

```
config.js          대회 이름, 구글 시트 주소, 채점 옵션  ← 리더보드 연결은 여기만 수정
assets/content.js  Competition Info / WOD & RULE 문구·이미지  ← 안내 문구는 여기만 수정
index.html         화면 골격
assets/style.css   디자인 (색상 변수 포함)
assets/app.js      CSV 파싱 · 순위 계산 · 리더보드 렌더링
assets/nav.js      메인 메뉴 · 하위 메뉴 전환 로직
sheets/*.csv       구글 시트에 가져올 템플릿
```

`config.js` 의 시트 주소를 비워두면 **예시 데이터 24팀**으로 화면이 뜹니다.
설정 전에 미리 모양을 확인할 때 쓰세요.
