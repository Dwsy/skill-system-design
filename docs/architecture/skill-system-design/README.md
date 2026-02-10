# Skill System Design v0.1-draft

> 为开发者打造的数字工具箱 —— 一个开放的技能生态系统设计草案

## 🎯 反成功声明

**这不是产品发布，是一份「如何打造开发者工具」的思考邀请。**

- 我们不追求垄断，我们追求**理念被接受**
- 我们欢迎任何人 fork、改进、**甚至替代**这套设计
- 如果大公司采纳且做得更好，我们会**庆祝并退出**
- 我们的成功标准是：**这套理念变得不再必要**（因为有更优方案）

**我们准备好了被替代，你准备好了吗？** 🚀

---

## 关于本文档

本文档记录了两个开发者（[@KeenDragon](https://pi-messenger) 和 UltraStorm）的深度思考碰撞，涵盖从架构设计到商业模式的完整蓝图。

**核心理念**：技能系统是「工匠工具」而非「厂商产品」，帮助开发者构建个人工作流，提升手艺。

## 文档结构

| 章节 | 内容 | 负责人 | 状态 |
|-----|------|--------|------|
| [01-philosophy](./01-philosophy.md) | 工匠工具定位、核心价值主张 | @KeenDragon | ✅ |
| [02-architecture](./02-architecture.md) | 技能包结构、registry、安装机制 | UltraStorm | ✅ |
| [03-dependency](./03-dependency.md) | DAG 约束、分层架构、版本协调 | @KeenDragon | 🚧 |
| [04-evolution](./04-evolution.md) | evolution.yml、健康检查、弃用策略 | @KeenDragon | ✅ |
| [05-privacy](./05-privacy.md) | 运行时隐私、供应链安全、ZK技能 | @KeenDragon + UltraStorm | ✅ |
| [06-business](./06-business.md) | 分层工匠经济、定价策略、反成功商业 | UltraStorm | ✅ |
| [07-guardrails](./07-guardrails.md) | 常见坑、约束清单、最佳实践 | @RedOwl | 🚧 |

## 快速导航

- **如果你想了解设计理念**：从 [01-philosophy](./01-philosophy.md) 开始
- **如果你是技能开发者**：重点看 [02-architecture](./02-architecture.md) 和 [03-dependency](./03-dependency.md)
- **如果你关心隐私和数据**：阅读 [05-privacy](./05-privacy.md)
- **如果你想知道商业模式**：[06-business](./06-business.md) 有完整方案

## 📜 协议与治理

```yaml
文档协议: CC0 (公共领域，随意使用)
代码协议: MIT (自由 fork，无需署名)
治理模式: RFC 流程（社区决策，非个人独裁）
```

### 功成身退的触发条件

为了让承诺可验证，我们定义具体的退出标准：

| 场景 | 条件 | 行动 |
|-----|------|------|
| 大公司推出兼容实现 | 协议开放 + 数据本地 + 用户掌控 | 庆祝 + 6个月过渡期 + 归档项目 |
| 社区出现更优实现 | star 数超越 + 活跃6个月 + 理念一致 | 推荐迁移 + 归档项目 |
| 理念被广泛接受 | 3+ 独立实现 + 主流工具采纳 | 发布成功声明 + 转向下一个理念 |

---

## 参与贡献

我们寻找的不是来「帮我们成功」的人，而是来：
- ✅ 验证或反驳这些理念
- ✅ 在各自场景实践并反馈
- ✅ 独立实现并分享经验
- ✅ 最终，带着这套思维模式去解决**下一个问题**

参与方式：
1. 阅读 [01-philosophy](./01-philosophy.md) 了解理念
2. 在讨论区分享你的想法
3. 认领一个章节或提出改进
4. 或者，静静地 fork 走，按你的方式实现

## 状态

🎉 **v0.3 已发布！** Guardrails 实现完成

✅ **文档已完成** (v0.2)：
- 01-philosophy - 工匠工具定位
- 02-architecture - 技术架构
- 03-dependency - 依赖管理
- 04-evolution - 演化机制
- 05-privacy - 隐私与安全
- 06-business - 分层工匠经济
- 07-guardrails - 约束与最佳实践

🛡️ **代码实现** (v0.3)：
- [guardrails/](../../guardrails/) - 可工作的 Guardrails CLI
- 3 个内置技能 (safe-rm, safe-git, tool-matrix)
- Shell 配置自动修复 (bash/zsh/fish)

**GitHub Release**: 
- [v0.3 - Guardrails Implementation](https://github.com/Dwsy/skill-system-design/releases/tag/v0.3) 🆕
- [v0.2 - Complete Documentation](https://github.com/Dwsy/skill-system-design/releases/tag/v0.2)

---

## 核心亮点

| 理念 | 说明 |
|-----|------|
| 🛠️ **工匠工具** | 工具服务于工匠，而非平台锁定 |
| 🛡️ **反成功设计** | 欢迎被替代，功成身退 |
| 💰 **分层经济** | Basic → Professional → Workshop → Marketplace |
| 🔒 **隐私优先** | 本地优先、可审计、零知识路线 |
| ⚙️ **Guardrails** | 防止常见错误，建立最佳实践 |

## 附录

- [协作方法论](./APPENDIX-collaboration.md) - 这份文档是如何诞生的

---

**让我们知道你的想法** 💬

---

*Last updated: 2026-02-11*
*Contributors: @KeenDragon, UltraStorm, @RedOwl*
