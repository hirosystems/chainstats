module.exports = {
  extends: ['@stacks/eslint-config'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: true,
  },
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    '@typescript-eslint/no-unsafe-return': 0,
    '@typescript-eslint/restrict-template-expressions': 0,
    'import/newline-after-import': ['error', { count: 1 }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
  },
};
