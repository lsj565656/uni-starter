module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'eslint:recommended',
    '@vue/eslint-config-prettier',
    'plugin:vue/vue3-essential',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    parser: '@typescript-eslint/parser'
  },
  plugins: ['vue', 'import', 'promise', 'unicorn'],
  rules: {
    // Vue 3 特定规则
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'warn',
    'vue/no-unused-vars': 'error',
    'vue/no-unused-components': 'error',

    // JavaScript 规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // 代码风格
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // uni-app 特定规则
    'no-global-assign': 'off',
    'no-restricted-globals': 'off'
  },
  globals: {
    // uni-app 全局变量
    uni: 'readonly',
    wx: 'readonly',
    getCurrentPages: 'readonly',
    getApp: 'readonly',
    plus: 'readonly',
    weex: 'readonly',
    process: 'readonly'
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        indent: 'off'
      }
    }
  ]
}
