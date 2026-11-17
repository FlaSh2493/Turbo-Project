---
title: Pre-commit 프로세스 개선 제안
description: 'Pre-commit 단계의 성능 저하 원인을 분석하고, lint-staged를 활용한 최적화 방안을 제안합니다.'
tags:
  - git
  - pre-commit
  - optimization
  - dx
date: '2026-01-30'
when_to_use: When considering changes to pre-commit hooks or debugging commit slowness
mode: model-decision
---

# Pre-commit 프로세스 개선 제안

## 1. 현상 및 문제점

최근 커밋 시도 중 `packages/ui` 등 작업과 무관한 패키지의 타입 에러(690개 이상)로 인해 커밋이 차단되는 현상이 발생했습니다.

### 원인 분석

- **범인**: `.husky/pre-commit` 훅에 설정된 `pnpm check-types` 명령어.
- **동작**: `tsc --build`를 실행하여 **프로젝트 전체(모든 패키지)**에 대한 빌드 및 타입 검사를 수행.
- **문제**:
  1.  **과도한 범위**: 내가 수정한 파일뿐만 아니라 전체 프로젝트를 검사하므로 속도가 느림.
  2.  **의존성 차단**: 다른 패키지의 기존 에러(Legacy)가 내 작업(New Feature)의 커밋을 막는 Blocking Issue 발생.
  3.  **DX 저하**: 로컬 개발 속도 저하 및 우회(`--no-verify`) 유발.

## 2. 개선 제안

Pre-commit 단계에서는 **"변경된 파일(Staged Files)"**에 집중하고, 전체 무결성 검사는 CI(Continuous Integration) 단계로 이관해야 합니다.

### 제안 1: Pre-commit 범위 축소 (권장)

- `.husky/pre-commit`에서 `pnpm check-types`를 제거합니다.
- 대신 `lint-staged`만 유지하여, 스테이징된 파일에 대해서만 Lint/Format 검사를 수행합니다.

### 제안 2: 타입 검사 전략 변경

- **로컬(Pre-commit)**: `lint-staged` 설정에 `tsc-files` 등을 도입하여 변경된 파일만 타입 체크 (또는 타입 체크 제외).
- **CI(GitHub Actions)**: PR 생성 시 `pnpm check-types`를 실행하여 전체 프로젝트 무결성 보장.

## 3. 기대 효과

- **속도 향상**: 커밋 시 불필요한 전체 빌드 시간 제거.
- **병목 해소**: 타 패키지의 기존 에러로 인한 내 작업 차단 방지.
- **롤 분리**: 로컬은 빠른 피드백, CI는 엄격한 무결성 검증으로 역할 분담.
