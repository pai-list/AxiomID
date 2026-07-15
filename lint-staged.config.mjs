// ponytail: lint-staged config — ESLint + pre-commit validation
// SOUL: Muraqabah — every staged file is checked honestly
const config = {
  "*.{ts,tsx,js,jsx,mjs}": [
    "eslint --fix --report-unused-disable-directives --max-warnings 0 --no-warn-ignored",
  ],
};

export default config;
