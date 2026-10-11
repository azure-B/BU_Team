# 마이페이지 프로필 편집 모달

- 일시: 2026-10-11
- 영역: Front

## 변경 요약

- 마이페이지 프로필 카드의 사진 카메라 오버레이와 `정보 변경` 버튼을 제거했다.
- `학적 정보 직접 수정` 행을 편집 진입점으로 연결했다. 클릭하면 전공·학년·학번·프로필 사진을 한 모달에서 편집한다.
- 사진을 선택하면 정사각형 미리보기를 표시하고 256px JPEG로 줄여 저장한다. 잘못된 파일, 5MB 초과 파일, 숫자 6~12자리 범위를 벗어난 학번을 확인한다.
- 학적 정보와 사진은 `baekseok.profile.v1` localStorage 키에 저장한다. 기존 mock 사용자 이름과 학부생 표시는 유지한다.

## 변경 파일

- `Front/src/components/setting/SettingSections.jsx` — 프로필 표시, 편집 모달, 저장 및 사진 처리
- `Front/src/components/setting/SettingSections.css` — 프로필 버튼 제거 및 모달 스타일
- `md/jobs/front/2026-10-11-mypage-profile.md`

## 사용 API

- 없음 (브라우저 로컬 저장).

## 검증

- 작업 후 프로덕션 빌드 확인.
