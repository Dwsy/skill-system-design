import { loadConfig } from './check';
import { safeRmRule } from '../rules/safe-rm';
import { FixResult, GuardrailRule, CheckContext } from '../types';
import { getShellAdapter, createBackup, hasGuardrailsConfig } from '../utils/shell-adapter';

// 规则注册表
const rules: GuardrailRule[] = [safeRmRule];

interface ApplyOptions {
  rule?: string;  // 只应用特定规则
  dryRun?: boolean;  // 模拟运行
}

export async function applyCommand(
  cwd: string = process.cwd(),
  options: ApplyOptions = {}
): Promise<void> {
  console.log('🔧 应用 Guardrails 自动修复...\n');

  // 加载配置
  const config = loadConfig(cwd);
  if (!config) {
    console.log('❌ 未找到 Guardrails 配置');
    console.log('   运行: pi guardrails init');
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('⚠️  模拟运行模式（不会实际修改）\n');
  }

  const context: CheckContext = {
    cwd,
    config,
    files: []
  };

  const results: { rule: string; result: FixResult }[] = [];
  let successCount = 0;
  let failCount = 0;

  // 应用规则修复
  for (const rule of rules) {
    const ruleConfig = config.rules[rule.id];

    // 跳过未启用的规则
    if (!ruleConfig?.enabled) {
      continue;
    }

    // 如果指定了特定规则，跳过其他
    if (options.rule && rule.id !== options.rule) {
      continue;
    }

    // 检查规则是否有 fix 方法
    if (!('fix' in rule) || typeof rule.fix !== 'function') {
      console.log(`⏭️  ${rule.name}: 不支持自动修复`);
      continue;
    }

    console.log(`修复: ${rule.name}...`);

    try {
      // 检查是否已经配置过
      const shellAdapter = getShellAdapter();
      if (hasGuardrailsConfig(shellAdapter.configPath, rule.id)) {
        console.log(`  ℹ️  配置已存在，将更新配置段`);
      }

      if (options.dryRun) {
        console.log(`  ✓ 模拟修复成功`);
        successCount++;
        continue;
      }

      // 执行修复
      const result = await rule.fix(context);
      results.push({ rule: rule.id, result });

      if (result.success) {
        successCount++;
        console.log(`  ✅ ${result.message}`);
        if (result.backup) {
          console.log(`     备份位置: ${result.backup}`);
        }
      } else {
        failCount++;
        console.log(`  ❌ ${result.message}`);
      }
    } catch (error) {
      failCount++;
      console.log(`  ❌ 修复失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('');
  }

  // 输出总结
  console.log('━'.repeat(50));
  console.log('修复结果:');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${failCount}`);
  console.log('━'.repeat(50));

  if (failCount > 0) {
    console.log('\n部分修复失败，请查看上面的错误信息');
    process.exit(1);
  } else if (successCount > 0) {
    console.log('\n🎉 所有修复应用成功！');
    console.log('\n⚠️  重要提示:');
    console.log('   配置已更新，但当前终端会话尚未生效');
    console.log('   请运行以下命令使配置生效:');
    console.log(`   source ${getShellAdapter().configPath}`);
    console.log('   或重新打开终端');
    process.exit(0);
  } else {
    console.log('\n没有需要修复的规则');
    process.exit(0);
  }
}
