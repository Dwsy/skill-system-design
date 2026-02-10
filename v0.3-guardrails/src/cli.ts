#!/usr/bin/env bun

/**
 * Guardrails CLI
 * 
 * Usage:
 *   pi guardrails init           # 初始化配置
 *   pi guardrails check          # 运行检查
 *   pi guardrails audit          # 生成审计报告
 *   pi guardrails apply          # 应用自动修复
 */

import { initCommand } from './commands/init';
import { checkCommand } from './commands/check';
import { applyCommand } from './commands/apply';

const args = process.argv.slice(2);
const command = args[0];
const cwd = process.cwd();

async function main() {
  switch (command) {
    case 'init':
    case 'i':
      await initCommand(cwd);
      break;

    case 'check':
    case 'c':
      await checkCommand(cwd);
      break;

    case 'audit':
    case 'a':
      console.log('📝 审计报告功能开发中...');
      console.log('   预计 v0.3.1 可用');
      break;

    case 'apply':
      const ruleFlag = args.find(arg => arg.startsWith('--rule='));
      const dryRun = args.includes('--dry-run');
      const rule = ruleFlag ? ruleFlag.split('=')[1] : undefined;
      await applyCommand(cwd, { rule, dryRun });
      break;

    case 'help':
    case '-h':
    case '--help':
    default:
      showHelp();
      break;
  }
}

function showHelp() {
  console.log(`
🔒 Guardrails - 安全护栏与最佳实践

Usage:
  pi guardrails <command> [options]

Commands:
  init, i              初始化 Guardrails 配置
  check, c             运行检查
  audit, a             生成审计报告 (即将推出)
  apply                应用自动修复 (即将推出)
  help                 显示帮助

Examples:
  pi guardrails init                    # 初始化项目
  pi guardrails check                   # 检查当前项目
  pi guardrails check --fix             # 检查并尝试修复

Configuration:
  配置文件位置: .pi/guardrails/config.yml

Documentation:
  https://pi.dev/docs/guardrails
`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
