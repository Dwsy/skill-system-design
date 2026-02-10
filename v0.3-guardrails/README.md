# 🔒 Guardrails

安全护栏与最佳实践 - Skill System v0.3 参考实现

## 快速开始

```bash
# 初始化 Guardrails
bun run src/cli.ts init

# 运行检查
bun run src/cli.ts check
```

## 功能

- **safe-rm**: 将 `rm` 重定向到 `trash`，防止误删
- **safe-git**: Git 操作保护（自动 stash、分支保护检查）
- **tool-matrix**: 推荐最佳搜索工具（fd/rg/ast-grep/ace）
- **dependency-audit**: 依赖安全审计
- **secrets-guard**: 敏感信息防泄漏

## 项目结构

```
src/
├── cli.ts              # CLI 入口
├── types/
│   └── index.ts        # 类型定义
├── commands/
│   ├── init.ts         # init 命令
│   └── check.ts        # check 命令
├── rules/
│   └── safe-rm.ts      # safe-rm 规则
└── utils/              # 工具函数
```

## 开发

```bash
# 安装依赖
bun install

# 运行开发版本
bun run dev -- init
bun run dev -- check

# 运行测试
bun test
```

## 许可证

MIT
