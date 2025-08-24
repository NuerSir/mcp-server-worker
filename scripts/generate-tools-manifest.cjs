/**
 * 生成工具清单（manifest.ts）的脚本
 * - 扫描 src/tools 目录下导出 `export class Xxx extends Tool` 的类
 * - 生成 src/tools/manifest.ts，导出 toolConstructors 构造器数组
 * - 该文件供运行时按构造器动态注册工具，支持热插拔与扩展
 * 使用方式：
 *   npm run gen:tools
 */

const fs = require('fs');
const path = require('path');

/**
 * 读取 tools 目录，提取 Tool 子类并生成 manifest.ts
 */
function main() {
  const repoRoot = process.cwd();
  const toolsDir = path.resolve(repoRoot, 'src', 'tools');
  const outPath = path.join(toolsDir, 'manifest.ts');

  if (!fs.existsSync(toolsDir)) {
    console.error('[gen-tools] 未找到工具目录：', toolsDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(toolsDir)
    .filter((f) => f.endsWith('.ts') && !['index.ts', 'manifest.ts'].includes(f));

  const importLines = [];
  const ctorNames = [];

  for (const file of files) {
    const full = path.join(toolsDir, file);
    const content = fs.readFileSync(full, 'utf8');

    // 匹配：export class ClassName extends Tool
    const m = content.match(/export\s+class\s+([A-Za-z0-9_]+)\s+extends\s+Tool/);
    if (!m) {
      // 非 Tool 子类文件可跳过（例如工具聚合或类型声明）
      continue;
    }
    const className = m[1];
    const importPath = './' + path.basename(file, '.ts');
    importLines.push(`import { ${className} } from '${importPath}';`);
    ctorNames.push(className);
  }

  // 生成的文件头注释（中文）
  const header =
    '/* 自动生成文件：请勿手动修改。运行 "npm run gen:tools" 可重新生成。*/\n';

  const body =
    `${header}${importLines.join('\n')}\n\n` +
    `export const toolConstructors = [\n` +
    `  ${ctorNames.join(',\n  ')}\n` +
    `] as const;\n`;

  fs.writeFileSync(outPath, body, 'utf8');
  console.log('[gen-tools] 已生成', path.relative(repoRoot, outPath), '共', ctorNames.length, '个工具。');
}

main();