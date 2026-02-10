# v0.3 Guardrails 测试计划

## 测试范围

### 1. 命令测试

#### `pi guardrails init`
- [ ] 创建 `.pi/guardrails/config.yml`
- [ ] 默认启用 5 个规则
- [ ] 已存在配置时提示而非覆盖

#### `pi guardrails check`
- [ ] 检测未配置的 safe-rm
- [ ] 检测已配置的 safe-rm
- [ ] 正确报告问题数量
- [ ] 提供修复建议

#### `pi guardrails apply`
- [ ] `--dry-run` 模式不修改文件
- [ ] 创建备份到 `~/.guardrails/backups/`
- [ ] 生成带版本标记的配置段
- [ ] 幂等性（重复执行不重复添加）
- [ ] `--rule=safe-rm` 只应用指定规则

### 2. Shell 兼容性测试

#### Bash
- [ ] 正确检测 `~/.bashrc`
- [ ] 生成 `alias rm='trash'` 语法

#### Zsh
- [ ] 正确检测 `~/.zshrc`
- [ ] 生成 `alias rm='trash'` 语法

#### Fish
- [ ] 正确检测 `~/.config/fish/config.fish`
- [ ] 生成 `abbr rm trash` 语法

### 3. 集成测试

```bash
# 完整流程测试
1. 在新目录运行 init
2. 运行 check，确认检测到未配置
3. 运行 apply --dry-run，确认预览
4. 运行 apply，确认配置生效
5. 运行 check，确认通过
6. 验证备份文件存在
7. 验证配置段格式正确
```

### 4. 边界情况

- [ ] 空 shell 配置文件
- [ ] 已存在其他 alias 配置
- [ ] 备份目录不存在时自动创建
- [ ] 备份超过 5 个时自动清理旧备份

## 测试命令

```bash
# 运行单元测试
bun test

# 运行特定测试
bun test tests/safe-rm.test.ts

# 手动测试流程
cd /tmp/test-project
bun run /path/to/v0.3-guardrails/src/cli.ts init
bun run /path/to/v0.3-guardrails/src/cli.ts check
bun run /path/to/v0.3-guardrails/src/cli.ts apply --dry-run
bun run /path/to/v0.3-guardrails/src/cli.ts apply
bun run /path/to/v0.3-guardrails/src/cli.ts check
```

## 预期结果

| 步骤 | 命令 | 预期输出 |
|------|------|----------|
| 1 | init | ✅ Guardrails 初始化完成 |
| 2 | check | ❌ 发现安全问题 |
| 3 | apply --dry-run | ✓ 模拟修复成功 |
| 4 | apply | ✅ 已配置 safe-rm |
| 5 | check | ✅ 所有检查通过 |

## 联调检查点

- [ ] KeenDragon 的 GuardrailsEngine 能加载我的规则
- [ ] FixableRule 接口兼容
- [ ] AuditReporter 能正确显示修复结果
