export default {
  $schema: 'https://json.schemastore.org/prettierrc.json',
  printWidth: 100,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  overrides: [
    {
      // ## 문서의 코드 펜스는 포맷하지 않는다 — 포맷하면 스니펫이 망가진다 (#199)
      //
      // `semi: false` 라서 prettier 가 코드 펜스 안의 JSX 문장에 **ASI 보호용 선행
      // 세미콜론**을 넣는다. 실측(`modal.docs.mdx`):
      //
      //     - <ModalContainer />
      //     + ;<ModalContainer />
      //
      // JS 로는 옳다. 그런데 문서의 스니펫은 **컴파일 단위가 아니라 소비자가 복사하는
      // 예시 조각**이고, 저 형태는 복사해서 쓰면 안 되는 코드다. 즉 검사받지 않는 것이
      // 손실이 아니라 목적이다.
      //
      // 이걸 끄면 md·mdx 에서 남는 변경은 **마크다운 표 셀 패딩과 빈 줄 정규화**뿐이고
      // **렌더는 동일하다** — 표 파싱은 셀 내부 패딩을 무시하고, 문단 앞 빈 줄 추가는
      // CommonMark 에서 블록 경계를 바꾸지 않는다. 그래서 `.docs.mdx` 를
      // `.prettierignore` 에 넣지 않고 여기서 위험한 부분만 분리했다 — 무시하면 표
      // 정렬이라는 실제 이득도 함께 버린다.
      //
      // **「일관성」을 이유로 이 override 를 지우지 마라.** 지우면 위 훼손이 돌아온다.
      files: ['*.md', '*.mdx'],
      options: { embeddedLanguageFormatting: 'off' },
    },
  ],
}
