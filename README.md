# 멘토-멘티 매칭 플랫폼

멘토와 멘티를 서로 매칭하는 시스템입니다.

## 기술 스택

- **Frontend**: Svelte + SvelteKit
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite + Prisma ORM
- **Monorepo**: Turbo

## 프로젝트 구조

```
├── apps/
├── backend/          # Express API 서버 (포트 8080)
├── client/           # Svelte 프론트엔드 (포트 3000)
├── packages/         # 공유 패키지
├── openapi.yaml      # API 명세서
└── turbo.json        # Turbo 설정
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 데이터베이스 설정
```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 3. 개발 서버 실행
```bash
# 루트에서 실행 (프론트엔드 + 백엔드 동시 실행)
npm run dev
```

### 4. 프로덕션 빌드 및 실행
```bash
npm run start
```

## API 문서

- **Swagger UI**: http://localhost:8080
- **OpenAPI JSON**: http://localhost:8080/openapi.json

## 애플리케이션 URL

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **API Endpoints**: http://localhost:8080/api

## 주요 기능

1. **회원가입 및 로그인** (JWT 인증)
2. **사용자 프로필 관리** (이미지 업로드 포함)
3. **멘토 목록 조회 및 검색**
4. **매칭 요청 시스템**
5. **요청 수락/거절 기능**

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm run start

# 린팅
npm run lint

# 클린
npm run clean
```
