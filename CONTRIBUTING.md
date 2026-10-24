# 함께 작업하기

동구 TIME QUEST 팀원의 Git 작업 흐름을 설명합니다.

## 1. 브랜치 사용 원칙

```text
이름/기능-브랜치 → master
```

현재 저장소는 `master`를 기준 브랜치로 사용합니다. 작업 브랜치는 `이름/기능` 형식으로 만들고 PR로 `master`에 병합합니다.

브랜치 이름 예시:

```text
lobo2u/game-screens
seonwoo/backend-api
songgyu/map-design
```

`master`에 직접 push하지 않습니다.

## 2. 새 작업 전: master 갱신

```bash
git status
git switch master
git pull --ff-only origin master
```

변경 파일이 남아 있으면 해당 작업 브랜치에서 먼저 정리합니다.

## 3. 작업 브랜치 만들기

```bash
git switch -c lobo2u/기능명
```

작업 전에 다음 세 가지를 담당자와 맞춥니다.

- 무엇을 바꾸는가?
- 어떤 파일까지 수정하는가?
- 어떤 결과가 나오면 끝난 것인가?

## 4. 확인 후 commit

```bash
git status
git diff
```

프런트엔드는 `frontend/`에서:

```bash
npm run check
npm run build
```

백엔드는 `backend/`에서:

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

확인이 끝나면 이번 작업 파일만 추가합니다:

```bash
git add frontend/src/screens/NewScreen.vue
git diff --staged
git commit -m "feat: 새 화면 추가"
```

커밋 메시지 형식:

```text
feat:  새 기능 추가
fix:   버그 수정
docs:  문서 수정
style: 스타일·디자인 변경
refactor: 구조 개선
test:  테스트 추가
```

## 5. push와 PR

```bash
git push -u origin lobo2u/기능명
```

GitHub에서 PR을 만들 때:

- **base**: `master`
- **compare**: 본인의 작업 브랜치
- 바꾼 내용, 이유, 확인한 결과를 PR 본문에 적습니다

PR 본문 예시:

```text
## 변경 내용
- 이번 작업에서 바꾼 점

## 확인 방법과 결과
- 실행한 명령과 결과
- 화면을 바꿨다면 직접 확인한 내용

## 확인이 필요한 점
- 아직 정하지 못한 부분
```

## 6. 충돌 대응

`git status`로 상태를 확인하고 팀원에게 공유합니다. `<<<<<<<`, `=======`, `>>>>>>>` 표시가 생기면 양쪽 변경 의도를 확인한 뒤 함께 해결합니다. 강제 push나 reset은 혼자 실행하지 않습니다.

## 7. 비밀값 관리

커밋에 넣지 않는 것:

- `.env` 파일
- API 키, 비밀번호, 인증 토큰
- 개인정보

실수로 올렸다면 즉시 팀장에게 알리고 해당 키를 폐기합니다.

## 8. 문서 관리

| 폴더 | 내용 |
|------|------|
| `docs/research/` | 지역 조사, 현장 답사, 출처 |
| `docs/meeting/` | 회의 기록, 결정 사항 |
| `docs/quests/` | 장소·미션 기획 |

역사 자료는 출처·발행 기관·링크를 기록합니다. 창작 설정과 역사적 사실을 구분합니다.
