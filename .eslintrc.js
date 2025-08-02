/* eslint-disable unicorn/prefer-module */
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
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.vue', '.json']
      }
    },
    'import/core-modules': ['vue', 'uni-app', '@dcloudio/uni-app']
  },
  plugins: ['vue', 'import', 'promise', 'unicorn'],
  rules: {
    // Vue 3 特定规则 - 更宽松
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'warn',
    'vue/no-unused-vars': 'off', // 关闭 Vue 未使用变量检查
    'vue/no-unused-components': 'warn', // 改为warn
    'vue/valid-v-for': 'off', // 关闭 v-for key 检查
    'vue/no-deprecated-v-on-native-modifier': 'off', // 关闭 .native 修饰符检查

    // JavaScript 规则 - 更宽松
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'warn', // 改为warn
    'no-undef': 'error',
    'prefer-const': 'warn', // 改为warn
    'no-var': 'warn', // 改为warn
    'no-useless-catch': 'off', // 关闭不必要的 try/catch 检查
    'no-empty': 'off', // 关闭空代码块检查

    // Promise 相关规则 - 更宽松
    'promise/always-return': 'off', // 关闭 Promise then 返回值检查
    'promise/catch-or-return': 'off', // 关闭 Promise catch 或 return 检查

    // 代码风格 - 更宽松
    indent: 'off', // 关闭缩进检查，让 Prettier 处理
    quotes: ['warn', 'single'], // 改为warn
    semi: ['warn', 'never'], // 改为warn
    'comma-dangle': 'off', // 关闭尾随逗号检查，允许自由使用
    'object-curly-spacing': ['warn', 'always'], // 改为warn
    'array-bracket-spacing': ['warn', 'never'], // 改为warn

    // Prettier 相关规则 - 避免与 Prettier 冲突
    'prettier/prettier': 'off', // 关闭 Prettier 规则检查，让 Prettier 自己处理

    // 对象和数组格式规则 - 更宽松
    'object-property-newline': 'off', // 允许对象属性在同一行
    'array-element-newline': 'off', // 允许数组元素在同一行
    'object-curly-newline': 'off', // 允许对象括号换行
    'array-bracket-newline': 'off', // 允许数组括号换行

    // Import 相关规则 - 更宽松
    'import/no-unresolved': 'off', // 完全关闭模块解析检查
    'import/extensions': 'off', // 关闭文件扩展名检查
    'import/no-relative-parent-imports': 'off', // 关闭相对路径检查
    'import/no-absolute-path': 'off', // 关闭绝对路径检查
    'import/no-dynamic-require': 'off', // 关闭动态 require 检查
    'import/namespace': 'off', // 关闭命名空间检查
    'import/named': 'off', // 关闭命名导入检查
    'import/no-duplicates': 'off', // 关闭重复导入检查
    'import/order': 'off', // 关闭导入顺序检查
    'import/no-self-import': 'off', // 关闭自导入检查
    'import/no-cycle': 'off', // 关闭循环导入检查

    // uni-app 特定规则
    'no-global-assign': 'off',
    'no-restricted-globals': 'off',

    // 添加更多宽松规则
    'space-before-function-paren': 'off',
    'comma-spacing': 'warn',
    'key-spacing': 'warn',
    'keyword-spacing': 'warn',
    'space-infix-ops': 'warn',
    'space-before-blocks': 'warn',
    'brace-style': 'off', // 关闭大括号样式检查
    'max-len': 'off', // 关闭行长度限制
    'no-multiple-empty-lines': 'warn',
    'eol-last': 'off', // 关闭文件末尾换行符检查

    // unicorn 规则调整 - 更宽松
    'unicorn/prefer-module': 'off', // 允许使用 CommonJS module.exports
    'unicorn/prefer-json-parse-buffer': 'off',
    'unicorn/prefer-array-find': 'warn',
    'unicorn/prefer-array-index-of': 'off', // 关闭数组索引查找方法检查
    'unicorn/prefer-at': 'off', // 关闭 .at() 方法检查，允许使用数组索引访问
    'unicorn/prefer-array-some': 'warn',
    'unicorn/prefer-includes': 'warn',
    'unicorn/prefer-string-starts-ends-with': 'warn',
    'unicorn/prefer-string-replace-all': 'off', // 关闭 replaceAll 检查，允许使用 replace
    'unicorn/better-regex': 'off', // 关闭正则表达式优化检查
    'unicorn/prefer-string-trim-start-end': 'warn',
    'unicorn/prefer-logical-operator-over-ternary': 'off',
    'unicorn/prevent-abbreviations': 'off', // 关闭缩写检查，允许使用简短的变量名
    'unicorn/filename-case': 'off', // 关闭文件名格式检查，允许使用 camelCase
    'unicorn/prefer-spread': 'warn',
    'unicorn/prefer-array-flat': 'warn',
    'unicorn/prefer-array-flat-map': 'warn',
    'unicorn/prefer-object-from-entries': 'warn',
    'unicorn/prefer-optional-catch-binding': 'off', // 关闭可选 catch 绑定检查
    'unicorn/prefer-regexp-test': 'warn',
    'unicorn/prefer-date-now': 'warn',
    'unicorn/prefer-number-properties': 'warn',
    'unicorn/prefer-math-trunc': 'warn',
    'unicorn/prefer-negative-index': 'warn',
    'unicorn/prefer-prototype-methods': 'warn',
    'unicorn/prefer-set-has': 'off', // 关闭 Set.has 检查，允许使用数组
    'unicorn/prefer-switch': 'off',
    'unicorn/prefer-ternary': 'off',
    'unicorn/no-array-instanceof': 'warn',
    'unicorn/no-array-for-each': 'off', // 关闭 forEach 使用检查，允许使用 forEach 方法
    'unicorn/no-array-callback-reference': 'off', // 关闭数组回调函数引用检查
    'unicorn/prefer-node-protocol': 'off', // 关闭 Node.js 协议前缀检查
    'unicorn/no-console-spaces': 'warn',
    'unicorn/no-hex-escape': 'warn',
    'unicorn/no-new-buffer': 'warn',
    'unicorn/no-process-exit': 'warn',
    'unicorn/no-unreadable-array-destructuring': 'warn',
    'unicorn/no-unsafe-regex': 'warn',
    'unicorn/no-useless-undefined': 'warn',
    'unicorn/no-null': 'off', // 关闭 null 使用检查，允许使用 null
    'unicorn/number-literal-case': 'warn',
    'unicorn/throw-new-error': 'warn',
    'unicorn/escape-case': 'off' // 关闭转义字符大小写检查
  },
  globals: {
    // uni-app 全局变量
    uni: 'readonly',
    uniCloud: 'readonly', // 添加 uniCloud 全局变量
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
