실습 소스는 이 폴더에서 수정하고, 저장소 루트에서 아래 명령으로 `index.html`에 포함합니다.

```sh
node scripts/embed-practice.cjs
node scripts/verify-practice.cjs
node scripts/verify-animation.cjs
```

- `uiux.html`, `animation.html`: 각 실습의 설명, 상태, 동작.
- `responsive.js`, `responsive-preview.html`: 너비 조절 도구와 실제 미디어 쿼리를 사용하는 학급 페이지. UI/UX 소스의 `RESPONSIVE_DEMO` 위치에 삽입됩니다.
- `layout.css`, `frame.js`: 두 실습의 화면 높이 대응, 전체화면 목차·도움말·키보드 조작.
- `typography.css`: UI/UX 기준으로 공유하는 제목, 영문 부제, 목차 글꼴과 간격.
- `animation-scroll.css`: 실제 실습 영역 높이에 맞춘 스크롤 구간. `animation.html`의 ResizeObserver가 전체화면 전환과 크기 변경을 반영합니다.
- `activities.css`: 실습 내용의 높이 확장과 실제 작업 영역 너비에 따른 컨테이너 쿼리.
- `buttons.css`: 실습 전체화면·해제 버튼의 공통 디자인.
- `shell.css`, `shell.js`: 강의 페이지의 전체화면 전환과 실습 iframe 사이의 상태 전달.
- `export.js`: 강의의 HTML 내보내기. 현재 강의 데이터와 두 실습의 내장 원본을 하나의 파일로 저장합니다.

실습 전체화면은 브라우저 창의 작업 영역을 채우는 방식이며 주소 표시줄은 유지합니다. 제목·해제 버튼은 실습 위에 표시하고, 너비 1,000px 이상에서는 설명·프롬프트를 오른쪽에 둡니다. 좁은 화면에서는 설명 버튼으로 열 수 있습니다. Esc 키는 실습 안쪽 iframe에 초점이 있을 때도 전체화면을 해제합니다.

실습 상단 도구는 전체화면 버튼 하나입니다. 초기화는 실습 내부에서 사용하며, 전체화면의 주제 목록은 방향키·Enter·Space·Esc로 조작할 수 있습니다. 파일 다운로드는 강의 탭의 내보내기로 통합했습니다.

배포 파일은 `index.html` 하나로 계속 작동합니다. 실습 소스·스타일·스크립트와 미리보기는 빌드 시 모두 내장되어 HTML 다운로드 후에도 인터넷 없이 이용할 수 있습니다. 원본 강의의 `embedded-data`는 이 빌드에서 수정하지 않습니다.

검증 스크립트는 현재 `HEAD`의 강의 데이터·이미지와 비교하고, Chrome에서 전체화면, 47개 실습의 여러 화면 크기, 반응형 전환, 키보드 초점, 애니메이션 진행 단계, 오프라인 내보내기를 확인합니다. 캡처와 결과는 Git에서 제외한 `.qa/`에 생성합니다.

`verify-animation.cjs`는 두 주제의 실제 글꼴·크기·굵기·줄 높이·자간을 비교하고, 네 가지 화면 크기에서 스크롤 실습 9개를 마우스 휠로 조작합니다. 진행 막대의 100% 도달, 형광펜 시작·초기화, 지연 로딩, 목차 이동과 화면 크기 변경도 확인합니다.
