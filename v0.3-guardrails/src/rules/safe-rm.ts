import { GuardrailRule, CheckContext, CheckResult, FixResult } from '../types';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import {
  getShellAdapter,
  readFileSafe,
  checkCommandExists,
  generateConfigSection,
  createBackup,
  updateGuardrailsSection
} from '../utils/shell-adapter';

export const safeRmRule: GuardrailRule = {
  id: 'safe-rm',
  name: 'Safe RM',
  description: '将 rm 命令重定向到 trash，防止误删',
  category: 'safety',
  severity: 'error',
  enabled: true,

  async check(context: CheckContext): Promise<CheckResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 获取 shell 配置
    const adapter = getShellAdapter();
    const configContent = readFileSafe(adapter.configPath);

    if (configContent) {
      // 检查是否已有 safe-rm 别名
      const hasSafeRmAlias = configContent.includes('Guardrails: safe-rm') ||
        (configContent.includes('alias rm=') &&
          (configContent.includes('trash') || configContent.includes('safe-rm')));

      if (!hasSafeRmAlias) {
        issues.push(`未检测到 safe-rm 别名配置`);
        issues.push(`Shell 配置文件: ${adapter.configPath}`);
        suggestions.push('添加 alias rm="trash" 到 shell 配置');
        suggestions.push('或使用 pi guardrails apply --rule=safe-rm 自动配置');
      }

      // 检查是否有危险的 rm -rf 别名
      const hasRmrfAlias = configContent.match(/alias\s+rmrf?\s*=/);
      if (hasRmrfAlias) {
        issues.push(`检测到危险的 rm/rmrf 别名`);
        suggestions.push('移除 rmrf 别名，使用 trash 替代');
      }
    }

    // 检查 trash 工具是否安装
    const hasTrash = checkCommandExists('trash');
    if (!hasTrash) {
      issues.push('未安装 trash 工具');
      suggestions.push('安装: bun install -g trash-cli');
      suggestions.push('或: brew install trash');
    }

    // 检查 trash 目录
    const trashDir = resolve(homedir(), '.trash');
    if (!existsSync(trashDir)) {
      suggestions.push('创建 trash 目录: mkdir ~/.trash');
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? '✅ safe-rm 配置正确'
        : `⚠️  发现 ${issues.length} 个安全问题`,
      details: issues,
      suggestions
    };
  },

  async fix(context: CheckContext): Promise<FixResult> {
    try {
      const adapter = getShellAdapter();
      const configPath = adapter.configPath;

      // 创建备份
      const backupPath = createBackup(configPath);

      // 生成 safe-rm 配置段
      const aliases: Record<string, string> = {
        'rm': 'trash',
        'rmrf': 'echo "使用 trash 替代 rm -rf" && trash',
        'trash-list': 'ls -la ~/.trash/',
        'trash-restore': 'mv ~/.trash/$1 ./'
      };

      const configSection = generateConfigSection(
        adapter,
        'safe-rm',
        '1.0.0',
        aliases
      );

      // 更新配置文件
      updateGuardrailsSection(configPath, 'safe-rm', configSection);

      return {
        success: true,
        message: `✅ 已配置 safe-rm (${adapter.type})`,
        backup: backupPath
      };
    } catch (error) {
      return {
        success: false,
        message: `配置失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};


