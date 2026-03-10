# PhishGuard AI — Gmail Add-on 설치 가이드

## 📋 필요한 것
- Google 계정
- Gemini API 키 (https://aistudio.google.com/apikey 에서 무료 발급)

---

## 🚀 설치 단계 (10분 소요)

### Step 1 — Gemini API 키 발급
1. https://aistudio.google.com/apikey 접속
2. **Create API key** 클릭
3. 키를 복사해 저장해두기 (무료 사용 가능)

### Step 2 — Google Apps Script 프로젝트 생성
1. https://script.google.com 접속
2. **새 프로젝트** 클릭
3. 프로젝트 이름을 `PhishGuard AI` 로 변경

### Step 3 — 매니페스트 파일 활성화
1. 상단 메뉴 **보기 → 매니페스트 파일 표시** 클릭
2. 왼쪽 파일 목록에 `appsscript.json` 이 나타남

### Step 4 — 코드 붙여넣기
1. `appsscript.json` 클릭 → 내용을 전부 지우고 제공된 `appsscript.json` 내용 붙여넣기
2. `Code.gs` 클릭 → 내용을 전부 지우고 제공된 `Code.gs` 내용 붙여넣기

### Step 5 — API 키 입력
`Code.gs` 파일 상단 1번째 줄:
```
var GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
```
→ `YOUR_GEMINI_API_KEY_HERE` 부분을 실제 Gemini API 키로 교체

### Step 6 — 저장 및 배포
1. **Ctrl+S** (저장)
2. 상단 **배포 → 새 배포** 클릭
3. 유형: **부가기능** 선택
4. 설명: `v1.0` 입력
5. **배포** 클릭
6. 권한 요청 팝업 → **액세스 허용** 클릭

### Step 7 — Gmail에서 테스트
1. 상단 **배포 → 테스트 배포** 클릭
2. **설치** 클릭
3. Gmail(https://mail.google.com) 열기
4. 아무 이메일이나 클릭
5. 오른쪽 사이드바에 🛡 **PhishGuard AI** 패널이 나타남
6. **AI 피싱 분석 시작** 버튼 클릭

---

## 📁 파일 구조
```
PhishGuard-Gmail-Addon/
├── Code.gs           ← 메인 로직 (Gemini 2.5 API 호출, 카드 UI)
└── appsscript.json   ← 부가기능 설정 및 권한
```

---

## ❓ 자주 묻는 질문

**Q: "이 앱을 확인하지 않았습니다" 경고가 뜨면?**
A: **고급 → PhishGuard AI(으)로 이동** 클릭하면 됩니다.

**Q: 분석이 안 되면?**
A: Apps Script 편집기 상단 **실행 → 로그 보기** 에서 오류 확인

**Q: Gemini API 무료인가요?**
A: 네! Google AI Studio에서 발급한 키는 무료 할당량이 있어 팀 프로젝트 데모에 충분합니다.

**Q: 다른 팀원도 쓰게 하려면?**
A: 배포 시 액세스 범위를 "도메인 내 모든 사용자" 로 설정하면 됩니다.

---

## 🎨 UI 미리보기
- 이메일 열기 → 오른쪽 패널에 발신자/제목 표시
- 분석 버튼 클릭 → Gemini 2.5가 판단
- 결과: ✅ 안전 / ⚠️ 의심 / 🚨 위험 + 점수 + 상세 지표
- 위험 이메일은 "스팸으로 신고" 버튼 활성화
