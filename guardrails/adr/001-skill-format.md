# ADR 001: Guardrails Skill Format

## Status
Accepted

## Context
v0.3 目标是把 07-guardrails 做成可安装的技能。需要定义清晰的 skill 格式，与 02-architecture 对齐。

## Decision

### Skill 目录结构

```
@builtin/guardrails-safe-rm/
├── metadata.json       # Skill 元数据
├── rules/
│   ├── index.ts        # 规则入口
│   └── safe-rm.ts      # 具体规则实现
├── hooks/
│   ├── pre-command.sh  # 命令前钩子
│   └── post-audit.sh   # 审计后钩子
└── config/
    ├── default.yml     # 默认配置
    └── schema.json     # 配置校验
```

### metadata.json 格式

```json
{
  "name": "@builtin/guardrails-safe-rm",
  "version": "1.0.0",
  "type": "guardrail",
  "description": "将 rm 命令重定向到 trash",
  
  "guardrails": {
    "rules": [
      {
        "id": "safe-rm",
        "type": "command_intercept",
        "target": "rm",
        "action": "redirect",
        "to": "trash",
        "severity": "error",
        "message": "使用 'trash' 替代 'rm' 防止误删"
      }
    ],
    "hooks": ["pre-command", "post-execution"],
    "config": {
      "schema": "config/schema.json",
      "defaults": "config/default.yml"
    }
  },
  
  "engines": {
    "guardrails": ">=0.3.0"
  }
}
```

### Rule 类型定义

```typescript
interface GuardrailRule {
  id: string;
  type: 'command_intercept' | 'file_check' | 'env_check' | 'tool_check';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  
  // command_intercept
  target?: string;
  action?: 'redirect' | 'block' | 'confirm';
  to?: string;
  
  // file_check
  path?: string;
  condition?: 'exists' | 'not_exists' | 'readable' | 'writable';
  
  // tool_check
  tool?: string;
  alternatives?: string[];
}
```

## Consequences

### Positive
- 清晰的技能格式，易于扩展
- 与 02-architecture 的 metadata.json 兼容
- 支持多种规则类型（命令拦截、文件检查、工具检查）

### Negative
- 需要维护 schema 版本
- 规则类型扩展需要更新引擎

## Alternatives Considered

1. **纯配置 YAML**：简单但不够灵活
2. **WASM 插件**：灵活但复杂度高
3. **JavaScript 函数**：当前方案平衡了简单和灵活

## References
- 02-architecture.md: Skill 包结构
- 07-guardrails.md: Guardrails 最佳实践
