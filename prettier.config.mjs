/** @type {import("prettier").Config} */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 100,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  useTabs: false,
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        singleQuote: false,
        proseWrap: 'always',
      },
    },
  ],
};

export default config;
