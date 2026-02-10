# 07 - Guardrails: 约束与最佳实践

> 最好的错误是从不犯错，其次是及时阻止犯错。

## TL;DR

- **常见陷阱**：rm vs trash、git restore 限制、后台任务管理
- **Guardrail 技能**：强制使用安全工具的约束类技能
- **检查清单**：开发前、提交前、部署前的必做检查
- **团队协作**：代码审查 guardrails、配置规范、安全基线

---

## 常见陷阱（Common Pitfalls）

### 1. 文件操作陷阱

```bash
# ❌ 危险：永久删除，无法恢复
$ rm -rf ./important-files/

# ✅ 安全：移到回收站，可恢复
$ trash ./important-files/
```

**Guardrail 方案**：
```yaml
# ~/.pi/skills/@builtin/safe-rm
intercept:
  pattern: "rm -rf"
  action: "warn_and_confirm"
  message: "检测到 rm -rf，建议使用 trash 命令"
  
  fallback: "要求显式 --force 才能执行 rm"
```

### 2. Git 操作陷阱

```bash
# ❌ 危险：恢复所有文件，可能覆盖他人工作
$ git restore .

# ✅ 安全：只恢复自己修改的文件
$ git status --short | grep "^ M" | awk '{print $2}' | xargs git restore
```

**Guardrail 方案**：
```yaml
# ~/.pi/skills/@builtin/safe-git
git_restore_guardrail:
  intercept: "git restore ."
  check: "确认用户只恢复自己的修改"
  
  warning: |
    git restore . 会恢复所有修改，包括：
    - 你自己修改的文件 ✅
    - 他人修改但你本地有的文件 ⚠️
    
    建议使用：
    git restore <具体文件>
    
  require_explicit: "--i-know-what-im-doing"
```

### 3. 后台任务陷阱

```bash
# ❌ 危险：脱离终端后难以管理
$ long-running-task &

# ❌ 危险：nohup 仍然难以查看日志
$ nohup long-running-task &

# ✅ 安全：使用 tmux，可 attach/detach/查看日志
$ tmux new -s my-task "long-running-task"
```

**Guardrail 方案**：
```yaml
# ~/.pi/skills/@builtin/background-guardian
detect_background:
  pattern: "&$|nohup"
  action: "suggest_tmux"
  
  message: |
    检测到后台任务，建议使用 tmux：
    $ tmux new -s task-name "your-command"
    
    优势：
    - 可随时 attach 查看进度
    - 日志自动保存
    - 断线后任务继续运行
    - 多窗口管理
```

### 4. 环境变量泄露

```bash
# ❌ 危险：可能记录到 shell history
$ export API_KEY="sk-12345"

# ❌ 危险：明文存储在 .bashrc
$ echo 'export API_KEY="sk-12345"' >> ~/.bashrc

# ✅ 安全：使用密钥管理工具
$ pi secret set API_KEY  # 交互式输入，加密存储
```

### 5. 依赖安装陷阱

```bash
# ❌ 危险：全局安装，版本冲突
$ npm install -g some-package

# ❌ 危险：不检查 lock 文件
$ npm install  # 忽略 package-lock.json

# ✅ 安全：本地安装，使用锁定版本
$ npm ci  # 严格按 package-lock 安装
```

---

## Guardrail 型技能清单

### 什么是 Guardrail Skill？

```yaml
definition:
  purpose: "防止常见错误，强制使用最佳实践"
  type: "约束类技能，而非功能类技能"
  philosophy: "去误用，而非提供新功能"
  
  examples:
    - "禁止使用 rm，强制使用 trash"
    - "git restore 前确认影响范围"
    - "后台任务必须使用 tmux"
    - "提交前必须跑测试"
```

### 核心 Guardrail 技能

| Guardrail | 功能 | 严重程度 |
|-----------|------|---------|
| **safe-rm** | rm → trash 转换 | 🔴 Critical |
| **safe-git** | git restore 限制 | 🟡 Warning |
| **tmux-enforcer** | 后台任务强制 tmux | 🟡 Warning |
| **env-guardian** | 敏感信息检测 | 🔴 Critical |
| **dependency-guard** | 安装前检查 lock | 🟡 Warning |
| **test-gate** | 提交前强制测试 | 🟠 Required |
| **lint-gate** | 提交前强制 lint | 🟠 Required |

### 实现示例

```typescript
// @builtin/safe-rm/guardrail.ts
class SafeRmGuardrail {
  intercept(command: string): GuardrailResult {
    if (command.match(/rm\s+-rf?/)) {
      return {
        action: "BLOCK",
        reason: "检测到 rm 命令",
        suggestion: "使用 `trash` 替代，或添加 --force 确认",
        require_explicit_opt_in: "--i-accept-risk-of-rm"
      };
    }
    return { action: "ALLOW" };
  }
}

// @builtin/test-gate/guardrail.ts
class TestGateGuardrail {
  async onPreCommit(): Promise<GuardrailResult> {
    const hasTests = await this.checkTestFilesExist();
    const testsPass = await this.runTests();
    
    if (!hasTests) {
      return {
        action: "WARN",
        message: "没有检测到测试文件，建议添加"
      };
    }
    
    if (!testsPass) {
      return {
        action: "BLOCK",
        reason: "测试未通过",
        suggestion: "修复测试后再提交"
      };
    }
    
    return { action: "ALLOW" };
  }
}
```

---

## 检查清单（Checklists）

### 开发前检查清单

```markdown
## 开始新任务前

- [ ] 阅读项目 README 和 CONTRIBUTING
- [ ] 确认本地环境配置正确
- [ ] 从 main 分支创建功能分支
- [ ] 确认相关 guardrail 技能已启用
```

### 提交前检查清单

```markdown
## 提交代码前

- [ ] 代码能编译/运行
- [ ] 新增功能有对应测试
- [ ] 所有测试通过
- [ ] Lint 检查通过
- [ ] 敏感信息未泄露（API key、密码）
- [ ] 提交信息符合规范（conventional commits）
- [ ] 自我 review 一遍 diff
```

### 部署前检查清单

```markdown
## 部署到生产前

- [ ] 在 staging 环境测试通过
- [ ] 数据库迁移脚本已测试
- [ ] 回滚方案已准备
- [ ] 监控和告警已配置
- [ ] 文档已更新
- [ ] 团队成员已通知
```

---

## 团队协作 Guardrails

### 代码审查 Guardrails

```yaml
code_review_guardrails:
  required_reviewers: 2
  
  checklists:
    security:
      - "没有硬编码密钥"
      - "没有 SQL 注入风险"
      - "输入已验证和转义"
      
    performance:
      - "没有 N+1 查询"
      - "大数据集有分页"
      - "缓存策略合理"
      
    maintainability:
      - "函数长度 < 50 行"
      - "有适当的注释"
      - "命名清晰有意义"
      
  automated:
    - "CI 测试必须通过"
    - "代码覆盖率不下降"
    - "安全扫描无高危漏洞"
```

### 配置规范

```yaml
team_config_standards:
  editor:
    indent: "2 spaces"
    line_ending: "LF"
    trim_trailing_whitespace: true
    
  git:
    commit_template: "type(scope): subject"
    branch_naming: "feature/JIRA-123-description"
    
  dependencies:
    lock_file: "必须提交"
    update_policy: "每月第一周统一更新"
    security_patches: "立即应用"
```

### 安全基线

```yaml
security_baseline:
  secrets:
    storage: "1Password 或 Vault"
    rotation: "每 90 天"
    detection: "git-secrets 扫描"
    
  access:
    principle: "最小权限"
    review: "每季度审查一次"
    offboarding: "立即撤销离职人员权限"
    
  audit:
    logs: "保留 1 年"
    review: "每月审查异常"
    alerts: "实时通知"
```

---

## 最佳实践总结

### 个人开发者

1. **启用核心 guardrails**
   ```bash
   pi skill install @builtin/safe-rm
   pi skill install @builtin/safe-git
   pi skill install @builtin/tmux-enforcer
   ```

2. **建立个人检查清单**
   - 创建 `~/checklists/` 目录
   - 每个项目类型一个清单
   - 定期更新优化

3. **自动化重复检查**
   - 使用 git hooks
   - 配置 IDE 插件
   - 设置 CI 检查

### 团队负责人

1. **制定团队规范**
   - 文档化 guardrails
   - 新人 onboarding 培训
   - 定期回顾和优化

2. **渐进式推行**
   - 从 Warning 级别开始
   - 收集反馈调整规则
   - 逐步升级到 Required

3. **平衡安全与效率**
   - 避免 guardrails 成为负担
   - 允许例外（需审批）
   - 定期清理过时规则

---

## Guardrail 设计原则

### 1. 预防优于治疗

```yaml
设计思路:
  不要: 犯错后再提醒
  要: 在犯错前阻止
  
示例:
  不要: "你刚刚 rm 了重要文件，下次注意"
  要: "检测到 rm 命令，建议使用 trash"
```

### 2. 渐进式约束

```yaml
推行策略:
  Phase 1: 警告（Warning）- 让用户知道更好的方式
  Phase 2: 确认（Confirm）- 需要显式确认
  Phase 3: 强制（Required）- 必须遵守，可配置例外
```

### 3. 可配置性

```yaml
guardrail_config:
  safe-rm:
    level: "warn"        # warn / confirm / block
    whitelist: ["/tmp"]  # 某些目录允许 rm
    
  test-gate:
    level: "required"
    exceptions:
      - "docs/**"        # 文档修改不需要测试
      - "*.md"
```

### 4. 教育而非惩罚

```yaml
message_design:
  不要: "错误：你不能这样做"
  要: "建议：有更好的方式..."
  
  包含:
    - 为什么阻止
    - 更好的做法
    - 如何绕过（如果确实需要）
```

---

## 与其他章节的关联

- **01-philosophy**: Guardrails 体现「工匠工具」的自我保护
- **02-architecture**: Guardrail 技能的实现机制
- **05-privacy**: 安全基线与隐私保护的结合

---

## 快速参考卡片

```markdown
## 每日 Guardrails 检查

□ 启用了 safe-rm？
□ 启用了 safe-git？
□ 后台任务使用 tmux？
□ 敏感信息存在 1Password？
□ 提交前跑了测试？

## 每周 Guardrails 审查

□ 检查 guardrail 日志
□ 调整过于严格的规则
□ 添加新发现的陷阱
□ 团队分享最佳实践
```

---

*Prev: [06-business](./06-business.md) - 分层工匠经济*
*Related: [01-philosophy](./01-philosophy.md) - 工匠工具定位*
*Related: [02-architecture](./02-architecture.md) - Guardrail 实现机制*
