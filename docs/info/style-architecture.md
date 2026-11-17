# 스타일링 및 빌드 아키텍처 가이드

이 문서는 프로젝트의 스타일링 방식과 모노레포 환경에서의 빌드 전략을 설명합니다.

## 1. 스타일링 기술 스택

우리 프로젝트는 **Tailwind CSS v4**와 **class-variance-authority (CVA)**를 조합하여 사용합니다.

- **Tailwind CSS**: 유틸리티 우선(Utility-first) CSS 프레임워크로, 실제 스타일링을 담당합니다.
- **CVA**: 컴포넌트의 variant(크기, 색상, 상태 등)를 선언적으로 관리하기 위해 사용합니다.

> **참고**: 일부 파일 확장자가 `.style.ts`로 되어 있으나, 이는 현재 프로젝트 컨벤션일 뿐 **Vanilla Extract를 사용하지 않습니다.** 순수하게 Tailwind 클래스를 조합하는 TypeScript 파일입니다.

## 2. 패키지 구조 및 스타일 스캔

### AFDS 패키지 (`packages/afds`)

- 자체적으로 별도의 CSS 파일을 추출(Build)하지 않습니다.
- 컴포넌트 스타일은 `src/bricks/**/*.style.ts` 파일 내에 CVA 정의로 존재합니다.
- 공통 기본 스타일은 `src/styles/global.css`에 정의되어 있습니다.

### Storybook 및 서비스 앱

- `afds` 패키지의 소스 코드(`.ts`, `.tsx`)를 직접 스캔하여 필요한 Tailwind 클래스를 생성합니다.
- **Tailwind 설정 (`styles.css`)**:
  ```css
  @import 'tailwindcss';
  /* 패키지의 소스 파일을 직접 스캔하도록 설정 */
  @source "../../packages/afds/src/**/*.{ts,tsx}";
  ```

## 3. 빌드 및 배포 전략

### 엔트리 포인트 최적화

`afds` 패키지는 대규모 컴포넌트 라이브러리이므로 빌드 효율성을 위해 공개 인터페이스를 기준으로 엔트리를 관리합니다.

- **주요 엔트리**:
  - `index`: 핵심 컴포넌트
  - `headless`: 비제어 컴포넌트 및 훅
  - `schemas`: Zod 기반 유효성 검사 스키마
  - `tokens`: 디자인 토큰 및 CSS 변수

### 메모리 관리

컴포넌트 수가 많아짐에 따라 빌드 시 `JS heap out of memory`가 발생할 수 있습니다. 이를 방지하기 위해 빌드 스크립트에서 메모리 제한을 상향하여 실행합니다.

```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

## 4. 주의 사항

- 새로운 컴포넌트 추가 시 `src/index.ts`에서 export 해야 빌드 결과물에 포함됩니다.
- 스타일 수정 시 외부 앱(스토리북 등)에서 해당 클래스가 정상적으로 스캔되는지 확인하세요.
