#!/usr/bin/env node

/**
 * 代码格式修复脚本
 * 用于批量修复常见的格式问题
 */

const fs = require('fs')
const path = require('path')

// 需要修复的文件类型
const FILE_EXTENSIONS = ['.js', '.vue', '.ts']

// 需要忽略的目录
const IGNORE_DIRS = ['node_modules', 'unpackage', 'dist', 'uni_modules', '.git']

/**
 * 修复文件内容
 * @param {string} content 文件内容
 * @returns {string} 修复后的内容
 */
function fixFileContent(content) {
  let fixed = content

  // 1. 移除行尾的 CRLF 符号 (␍)
  fixed = fixed.replace(/\r\n/g, '\n')

  // 2. 移除对象和数组末尾的尾随逗号
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

  // 3. 确保文件末尾有一个换行符
  if (!fixed.endsWith('\n')) {
    fixed += '\n'
  }

  return fixed
}

/**
 * 递归遍历目录
 * @param {string} dir 目录路径
 * @param {Function} callback 回调函数
 */
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(filePath, callback)
      }
    } else {
      const ext = path.extname(file)
      if (FILE_EXTENSIONS.includes(ext)) {
        callback(filePath)
      }
    }
  })
}

/**
 * 主函数
 */
function main() {
  const targetDir = process.argv[2] || '.'
  const dryRun = process.argv.includes('--dry-run')

  console.log('开始修复代码格式...')
  console.log(`目标目录: ${targetDir}`)
  console.log(`模式: ${dryRun ? '预览模式' : '实际修复'}`)

  let fixedFiles = 0
  let totalFiles = 0

  walkDir(targetDir, filePath => {
    totalFiles++

    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const fixedContent = fixFileContent(content)

      if (content !== fixedContent) {
        console.log(`修复: ${filePath}`)

        if (!dryRun) {
          fs.writeFileSync(filePath, fixedContent, 'utf8')
        }

        fixedFiles++
      }
    } catch (error) {
      console.error(`处理文件失败: ${filePath}`, error.message)
    }
  })

  console.log('')
  console.log('处理完成!')
  console.log(`总文件数: ${totalFiles}`)
  console.log(`修复文件数: ${fixedFiles}`)

  if (dryRun) {
    console.log('')
    console.log('这是预览模式，没有实际修改文件。')
    console.log('运行以下命令进行实际修复:')
    console.log('node scripts/fix-format.js')
  }
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = { fixFileContent, walkDir }
