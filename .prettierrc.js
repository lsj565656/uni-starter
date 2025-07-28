module.exports = {
  // 每行最大长度 - 增加到120，减少换行
  printWidth: 120,

  // 使用2个空格缩进
  tabWidth: 2,

  // 使用空格而不是tab
  useTabs: false,

  // 行尾分号 - 改为自动，更宽松
  semi: false,

  // 使用单引号
  singleQuote: true,

  // 对象属性引号 - 改为更宽松的配置
  quoteProps: 'as-needed',

  // 对象括号内空格
  bracketSpacing: true,

  // 箭头函数参数括号 - 改为更宽松
  arrowParens: 'avoid',

  // 行尾换行符 - 改为自动检测，避免 CRLF/LF 冲突
  endOfLine: 'auto',

  // 尾随逗号 - 改为 none，完全禁用尾随逗号
  trailingComma: 'none',

  // HTML空格敏感度
  htmlWhitespaceSensitivity: 'css',

  // Vue文件script和style标签缩进
  vueIndentScriptAndStyle: false,

  // 嵌入代码格式化
  embeddedLanguageFormatting: 'auto',
}
