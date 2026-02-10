import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { GuardrailsConfig, CheckContext, RuleResult } from '../types';
import { safeRmRule } from '../rules/safe-rm';

// 规则注册表
const rules = [safeRmRule];

export async function checkCommand(cwd: string = process.cwd()): Promise<void> {
  console.log('🔍 运行 Guardrails 检查...\n');

  // 加载配置
  const config = loadConfig(cwd);
  if (!config) {
    console.log('❌ 未找到 Guardrails 配置');
    console.log('   运行: pi guardrails init');
    process.exit(1);
  }

  const context: CheckContext = {
    cwd,
    config,
    files: listFiles(cwd),
    git: await loadGitInfo(cwd)
  };

  const results: RuleResult[] = [];
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;

  // 运行启用的规则
  for (const rule of rules) {
    const ruleConfig = config.rules[rule.id];
    
    if (!ruleConfig?.enabled) {
      continue;
    }

    console.log(`检查: ${rule.name}...`);
    
    try {
      const result = await rule.check(context);
      
      const ruleResult: RuleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        severity: ruleConfig.severity || rule.severity,
        passed: result.passed,
        message: result.message,
        details: result.details
      };

      results.push(ruleResult);

      if (result.passed) {
        passedCount++;
        console.log(`  ✅ ${result.message}`);
      } else {
        if (ruleResult.severity === 'error') {
          failedCount++;
          console.log(`  ❌ ${result.message}`);
        } else {
          warningCount++;
          console.log(`  ⚠️  ${result.message}`);
        }
        
        if (result.details && result.details.length > 0) {
          for (const detail of result.details) {
            console.log(`     - ${detail}`);
          }
        }
        
        if (result.suggestions && result.suggestions.length > 0) {
          console.log('     建议:');
          for (const suggestion of result.suggestions) {
            console.log(`       • ${suggestion}`);
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ 检查失败: ${error instanceof Error ? error.message : String(error)}`);
      failedCount++;
    }
    
    console.log('');
  }

  // 输出总结
  console.log('━'.repeat(50));
  console.log('检查结果:');
  console.log(`  ✅ 通过: ${passedCount}`);
  console.log(`  ⚠️  警告: ${warningCount}`);
  console.log(`  ❌ 失败: ${failedCount}`);
  console.log('━'.repeat(50));

  if (failedCount > 0) {
    console.log('\n修复建议:');
    console.log('  pi guardrails apply    # 自动修复可修复的问题');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('\n有警告但不影响使用');
    process.exit(0);
  } else {
    console.log('\n🎉 所有检查通过！');
    process.exit(0);
  }
}

export function loadConfig(cwd: string): GuardrailsConfig | null {
  try {
    const configPath = resolve(cwd, '.pi', 'guardrails', 'config.yml');
    const content = readFileSync(configPath, 'utf-8');
    return parseYamlConfig(content);
  } catch {
    return null;
  }
}

function parseYamlConfig(content: string): GuardrailsConfig {
  // 简化版 YAML 解析
  const lines = content.split('\n');
  const config: GuardrailsConfig = {
    version: '1.0.0',
    presets: [],
    rules: {}
  };

  let currentRule: string | null = null;
  let inRules = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('version:')) {
      config.version = trimmed.split(':')[1].trim().replace(/"/g, '');
    }
    
    if (trimmed === 'rules:') {
      inRules = true;
      continue;
    }

    if (inRules && trimmed && !trimmed.startsWith('#')) {
      if (line.startsWith('  ') && !line.startsWith('    ') && trimmed.endsWith(':')) {
        currentRule = trimmed.slice(0, -1);
        config.rules[currentRule] = { enabled: true };
      }
      
      if (currentRule && trimmed.startsWith('enabled:')) {
        config.rules[currentRule].enabled = trimmed.split(':')[1].trim() === 'true';
      }
      
      if (currentRule && trimmed.startsWith('severity:')) {
        config.rules[currentRule].severity = trimmed.split(':')[1].trim() as any;
      }
    }
  }

  return config;
}

function listFiles(cwd: string): string[] {
  try {
    return readdirSync(cwd);
  } catch {
    return [];
  }
}

async function loadGitInfo(cwd: string): Promise<CheckContext['git']> {
  try {
    const { execSync } = require('child_process');
    const branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
    
    return {
      branch,
      isClean: status.trim() === ''
    };
  } catch {
    return undefined;
  }
}
