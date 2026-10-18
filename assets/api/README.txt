API 소개 슬라이드 · 2026.10.18

index.html을 열면 39~51페이지에서 13개 API를 볼 수 있습니다.
기상청 대신 Open-Meteo를 사용하며, 51페이지에 YouTube Data API를 추가했습니다.
기존 API 시뮬레이션 8장을 교체해 전체 강의는 61장입니다.

화면 예시
- screens.html / screens.js / screens.css / screen-details.css: 정적 웹앱 화면 원본
- 각 PNG: Chrome에서 캡처한 2400 × 900 화면 이미지
- 화면의 버튼·입력 항목은 이미지의 일부이며 실제 API를 호출하지 않습니다.
- 모든 화면은 '구현 화면 예시 · 가상 데이터'로 표시합니다.
- 도서 표지는 sources/books.json의 실제 출판사 자료입니다.
- 지도 배경은 OpenStreetMap이며 출처를 화면 안에 표시했습니다.
  Kakao API로 연결한 실제 결과가 아니라 지도 활용 방식의 예시입니다.

강의에 반영
1. catalog.json에서 설명·링크·비용·공식 근거를 수정합니다.
2. 화면을 수정했다면 node scripts/capture-api-screens.cjs 를 실행합니다.
3. node scripts/embed-api-assets.cjs 로 index.html에 반영합니다.
   이미지·스타일·강의 데이터가 내장되므로 HTML 한 파일만으로도 실행됩니다.
4. node scripts/verify-api-deck.cjs 로 이전 저장 파일 호환, 발표 조작,
   편집·자동 저장, 오프라인 내보내기, PDF 배치를 검사합니다.

공식 안내
catalog.json의 sources에 서비스별 정책 근거를 기록했습니다.
API 키가 필요 없는 Open-Meteo 무료 이용은 'API 문서 · 무료는 키 불필요'로,
Google Sheets·Calendar는 '인증 설정·API 활성화'로 구분했습니다.
Google Cloud 콘솔 링크는 로그인과 프로젝트 선택이 필요합니다.

검증 결과
- API 외 슬라이드 내용과 순서는 변경 전 데이터와 동일합니다.
- 이전 버전 1~4 저장 파일의 편집 내용·배치는 새 버전으로 옮겨집니다.
- 브라우저 검증 22개 통과, 신규 화면 13개 모두 내용 잘림 없음.
- 실제 PDF 61페이지 생성, 39~51페이지 제목·페이지 번호·이미지 확인.
- PDF 렌더링 16페이지를 이미지로 확인했습니다.
