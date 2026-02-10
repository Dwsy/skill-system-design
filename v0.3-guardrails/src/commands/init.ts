import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { GuardrailsConfig } from '../types';

const DEFAULT_CONFIG: GuardrailsConfig = {
  version: '1.0.0',
  presets: ['personal'],
  rules: {
    'safe-rm': {
      enabled: true,
      severity: 'error',
      options: {
        redirectToTrash: true,
        requireConfirmationForRecursive: true
      }
    },
    'safe-git': {
      enabled: true,
      severity: 'warning',
      options: {
        stashBeforeReset: true,
        checkBranchProtection: true
      }
    },
    'tool-matrix': {
      enabled: true,
      severity: 'info'
    },
    'dependency-audit': {
      enabled: true,
      severity: 'error',
      options: {
        maxVulnerabilities: 0,
        requireLockfile: true
      }
    },
    'secrets-guard': {
      enabled: true,
      severity: 'error',
      options: {
        patterns: ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN'],
        scanFiles: ['*.ts', '*.js', '*.json', '*.yml', '*.yaml']
      }
    }
  }
};

export async function initCommand(cwd: string = process.cwd()): Promise<void> {
  const guardrailsDir = resolve(cwd, '.pi', 'guardrails');
  const configPath = resolve(guardrailsDir, 'config.yml');

  // 检查是否已存在
  if (existsSync(configPath)) {
    console.log('⚠️  Guardrails 配置已存在');
    console.log(`   位置: ${configPath}`);
    console.log('   使用 --force 覆盖或手动编辑');
    return;
  }

  // 创建目录
  mkdirSync(guardrailsDir, { recursive: true });

  // 写入配置
  const configYaml = generateYamlConfig(DEFAULT_CONFIG);
  writeFileSync(configPath, configYaml, 'utf-8');

  console.log('✅ Guardrails 初始化完成！');
  console.log(`   配置位置: ${configPath}`);
  console.log('');
  console.log('下一步:');
  console.log('  pi guardrails check    # 检查当前项目');
  console.log('  pi guardrails audit    # 生成审计报告');
  console.log('');
  console.log('已启用规则:');
  Object.entries(DEFAULT_CONFIG.rules).forEach(([id, rule]) => {
    const icon = rule.enabled ? '✓' : '✗';
    console.log(`  ${icon} ${id}`);
  });
}

function generateYamlConfig(config: GuardrailsConfig): string {
  const lines = [
    '# Guardrails 配置文件',
    '# 文档: https://pi.dev/docs/guardrails',
    '',
    `version: "${config.version}"`,
    '',
    '# 预设配置',
    `presets:`,
    ...config.presets.map(p => `  - ${p}`),
    '',
    '# 规则配置',
    'rules:'
  ];

  for (const [id, rule] of Object.entries(config.rules)) {
    lines.push(`  ${id}:`);
    lines.push(`    enabled: ${rule.enabled}`);
    lines.push(`    severity: ${rule.severity}`);
    if (rule.options && Object.keys(rule.options).length > 0) {
      lines.push('    options:');
      for (const [key, value] of Object.entries(rule.options)) {
        if (Array.isArray(value)) {
          lines.push(`      ${key}:`);
          for (const v of value) {
            lines.push(`        - ${v}`);
          }
        } else if (typeof value === 'object' && value !== null) {
          lines.push(`      ${key}:`);
          for (const [k, v] of Object.entries(value)) {
            lines.push(`        ${k}: ${v}`);
          }
        } else {
          lines.push(`      ${key}: ${value}`);
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
