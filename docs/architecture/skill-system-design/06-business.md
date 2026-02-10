# 06 - Business: 分层工匠经济

> 不是卖工具，是帮工匠添置趁手装备。

## TL;DR

- **四层经济模型**：Basic（开源免费）→ Professional（买断制）→ Workshop（团队订阅）→ Marketplace（平台抽成）
- **买断制心理学**：锚定技术书价格（$19-49），强调 ROI 而非成本
- **反成功定价**：不以垄断为目标，以理念传播为成功标准
- **维护窗口**：24个月安全承诺，渐进式弃用，优雅退出

---

## 为什么不是订阅制？

### 订阅制的问题

```yaml
订阅制的隐性成本:
  心理负担:
    - "我又多了一个月费"
    - "不用就亏了" → 强迫使用
    - "取消麻烦" → 拖延取消
    
  长期成本:
    - $20/月 × 12月 = $240/年
    - 5年 = $1200
    - 远超买断制
    
  锁定效应:
    - 数据在平台
    - 迁移成本高
    - 涨价只能接受
```

### 买断制的优势

```yaml
买断制的心理契约:
  所有权感:
    - "这是我的工具"
    - "永久可用，无需续费"
    - "可以随时离线使用"
    
  成本控制:
    - 一次性投入，预算可控
    - 无"订阅 creep"（订阅堆积）
    - 公司采购更容易批准
    
  工匠友好:
    - 工具适应工匠的节奏
    - 不会被打扰（没有"续费提醒"）
    - 可以沉淀到个人工具箱
```

---

## 分层工匠经济模型

### 四层架构

```yaml
skill_economy_tiers:
  
  basic:                    # 基础层
    model: "开源 / 免费"
    price: "$0"
    target: "个人开发者、学习者"
    examples:
      - "git-helpers: 常用 git 命令封装"
      - "file-utils: 文件操作快捷方式"
      - "lint-configs: 共享的代码规范"
    spirit: "工匠互助，工具共享"
    value_proposition: "降低入门门槛，建立社区"
    
  professional:             # 专业层
    model: "买断制"
    price: "$19 - $149"
    target: "专业开发者、独立工匠"
    examples:
      - "deploy-expert: K8s 部署专业工具 ($49)"
      - "security-scanner: 安全审计技能 ($79)"
      - "performance-profiler: 性能分析专家 ($99)"
    spirit: "添置专业工具，永久归属"
    value_proposition: "深度领域能力，一次性投资"
    
  workshop:                 # 工坊层
    model: "团队订阅"
    price: "$10/人/月"
    target: "开发团队、企业"
    examples:
      - "team-toolkit: 共享技能库管理"
      - "compliance-suite: 合规审计套件"
      - "onboarding-automation: 新人入职自动化"
    spirit: "租用配备齐全的工坊"
    value_proposition: "团队协作、版本锁定、合规审计"
    
  marketplace:              # 市集层
    model: "平台抽成 10-20%"
    price: "由第三方工匠定价"
    target: "第三方技能作者、专业工作室"
    examples:
      - "@studio-ai/ml-pipeline: AI 流水线 ($199)"
      - "@consultant-corp/audit-pro: 审计专家服务 ($499)"
    spirit: "市集摊位费，手艺变现"
    value_proposition: "生态繁荣，专业变现"
```

### 为什么 Workshop 用订阅？

```yaml
workshop_subscription_rationale:
  团队协作的特殊性:
    - 成员变动频繁 → 按人计费更灵活
    - 需要集中管理 → 管理员控制权限
    - 合规要求持续更新 → 订阅确保最新
    
  与买断制的区别:
    - 不是"买工具"，是"租服务"
    - 服务包括：管理后台、合规更新、技术支持
    - 离职成员自动失去访问，无安全隐患
```

---

## 买断制定价策略

### 心理锚点

```yaml
price_anchors:
  技术书:
    range: "$30 - $50"
    comparison: "一本书的价格，学会一个技能"
    
  一小时咨询:
    range: "$100 - $200"
    comparison: "一小时咨询费，永久掌握能力"
    
  JetBrains 插件:
    range: "$20 - $40"
    comparison: "IDE 生态的定价参考"
    
  培训课程:
    range: "$50 - $500"
    comparison: "比培训便宜，比文档深入"
```

### 建议定价

```yaml
pricing_recommendations:
  entry_level:
    price: "$19 - $29"
    description: "入门技能，降低尝试门槛"
    examples: ["file-organizer", "git-aliases", "snippet-manager"]
    
  professional:
    price: "$49 - $79"
    description: "专业领域，强调 ROI"
    examples: ["k8s-deploy", "security-scanner", "test-automation"]
    
  master_suite:
    price: "$99 - $149"
    description: "大师级套装，体系化能力"
    examples: ["devops-complete", "security-suite", "ai-pipeline"]
```

### ROI 话术

```markdown
# 不要这样说
"这个 skill 卖 $49"

# 要这样说
"掌握这个技能，帮你省 5 小时 debug 时间
按 $50/小时计算，第一次使用就回本"

# 计算公式
技能价格 = (节省时间 × 时薪) × 0.1-0.2

示例:
  - 节省时间: 10 小时/月
  - 时薪: $50
  - 价值: $500/月
  - 合理价格: $50-100 (一次性)
  - 投资回收期: 第一次使用
```

---

## 版本管理与定价

### 买断制的版本策略

```yaml
version_pricing:
  initial_purchase:
    includes: "当前大版本 + 终身 bugfix"
    example: "买 v1.x，永远可用"
    
  major_upgrade:
    price: "约 40% 原价"
    example: "v1 → v2 升级费 $19 (原 $49)"
    options:
      - "一次性升级费"
      - "或订阅模式 ($5/月)"
      
  loyalty_discount:
    early_adopter: "20% off"
    long_term_user: "30% off"
    community_contributor: "免费升级"
```

### 维护窗口

```yaml
maintenance_commitment:
  security_patches: "24 个月"
  bug_fixes: "24 个月"
  feature_updates: "当前大版本内"
  
  lifecycle:
    active:
      duration: "发布 ~ 新版本发布"
      support: "功能更新 + bugfix + 安全补丁"
      
    maintenance:
      duration: "12 个月"
      support: "bugfix + 安全补丁"
      message: "建议使用新版本"
      
    deprecated:
      duration: "6 个月"
      support: "仅安全补丁"
      level: "warning"
      
    eol:
      action: "停止维护，推荐迁移"
```

---

## 反成功商业模式

### 核心原则

```yaml
anti_success_principles:
  1_no_monopoly:
    statement: "我们不追求市场份额"
    alternative: "追求理念被接受"
    
  2_no_lock_in:
    statement: "不锁定用户数据"
    alternative: "开放格式，随时导出"
    
  3_no_evergreen_subscription:
    statement: "不提供无法买断的服务"
    alternative: "核心能力买断，增值服务订阅"
    
  4_graceful_exit:
    statement: "如果大公司做得更好，我们庆祝并退出"
    alternative: "功成身退，创造下一个理念"
```

### 功成身退的触发条件

```yaml
graceful_exit_triggers:
  big_company_adoption:
    conditions:
      - "推出兼容实现"
      - "协议保持开放"
      - "数据本地存储"
      - "用户完全掌控"
    action:
      - "公开发布庆祝声明"
      - "6 个月过渡期维护"
      - "归档项目，指向新实现"
      - "转向下一个理念"
      
  community_superior:
    conditions:
      - "社区出现更优实现"
      - "star 数超越我们"
      - "活跃度持续 6 个月"
      - "理念保持一致"
    action:
      - "公开推荐迁移"
      - "协助用户过渡"
      - "归档项目"
      
  idea_ubiquitous:
    conditions:
      - "3+ 独立实现并存"
      - "主流开发工具采纳核心概念"
      - "「工匠工具」成为默认思维模式"
    action:
      - "发布「成功声明」"
      - "理念已不需要我们"
      - "庆祝，然后创造下一个"
```

### 财务可持续性

```yaml
financial_sustainability:
  目标: "覆盖成本 + 合理利润，不求最大化"
  
  收入来源:
    - "Professional 层买断（主要）"
    - "Workshop 层订阅（补充）"
    - "Marketplace 抽成（生态）"
    - "咨询/培训（可选）"
    
  成本控制:
    - "去中心化 registry（降低服务器成本）"
    - "社区维护（降低人力成本）"
    - "自动化（降低运营成本）"
    
  透明度:
    - "公开财务报告"
    - "社区监督支出"
    - "盈余再投资或降价"
```

---

## 团队场景的特殊考量

### 分层配置的经济学

```yaml
team_pricing_models:
  # 模型 A: 按人头
  per_seat:
    price: "$10/人/月"
    pros: "简单，可预测"
    cons: "大型团队成本高"
    
  # 模型 B: 按使用量
  usage_based:
    price: "$0.01/次技能执行"
    pros: "用多少付多少"
    cons: "难以预测，可能更高"
    
  # 模型 C: 混合（推荐）
  hybrid:
    base: "$50/月（含 5 人）"
    additional: "$8/人/月"
    pros: "小团队友好，大团队可扩展"
```

### 合规与审计的价值

```yaml
compliance_value_proposition:
  传统成本:
    - "合规顾问: $200/小时"
    - "审计工具: $1000+/月"
    - "人工审查: 数周时间"
    
  skill_system_solution:
    - "内置合规检查: 实时"
    - "自动审计日志: 自动生成"
    - "团队标准化: 一键部署"
    
  roi: "一次 Workshop 订阅 ($10/人/月) vs 传统方案 ($5000+/月)"
```

---

## 推广策略

### 诚实筛选

```yaml
honest_marketing:
  吸引对的人:
    - "长期主义者"
    - "理念驱动者"
    - "开源原教旨主义者"
    - "厌倦平台锁定的开发者"
    
  过滤错的人:
    - "机会主义者"
    - "短期套利者"
    - "平台思维者"
    - "追求「独角兽」的 VC"
    
  测试问题:
    - "问: 你们怎么赚钱？" → 理念不匹配
    - "问: 怎么防止别人抄袭？" → 理念不匹配
    - "问: 我可以把这套用在公司内网吗？" → 理念匹配 ✓
```

### 社区叙事

```yaml
community_stories:
  case_studies:
    - title: "我如何用 skill 替代了 $200/月的 CI 平台"
      author: "独立开发者 @xxx"
      highlight: "买断制技能 vs 订阅 SaaS"
      
    - title: "团队技能库如何帮新人 onboarding 提速 50%"
      author: "Tech Lead @yyy公司"
      highlight: "Workshop 层价值"
      
    - title: "从「平台依赖」到「工具自主」的转变"
      author: "全栈开发者 @zzz"
      highlight: "理念转变的心路历程"
```

---

## 与其他章节的关联

- **01-philosophy**: 工匠工具定位支撑商业模式
- **04-evolution**: 维护窗口与版本定价关联
- **05-privacy**: 隐私保护作为差异化卖点

---

## 总结

**分层工匠经济的核心洞察**:

1. **Basic 层免费** → 建立社区，降低门槛
2. **Professional 层买断** → 个人投资，永久归属
3. **Workshop 层订阅** → 团队协作，服务导向
4. **Marketplace 抽成** → 生态繁荣，手艺变现

**反成功商业的本质**:

> 不是「让用户离不开我们」，而是「帮助用户不需要我们」。

**功成身退的勇气**:

> 当理念被广泛接受时，工具可以被替代，这才是真正的成功。

---

*Next: [07-guardrails](./07-guardrails.md) - 常见坑、约束清单、最佳实践*
*Related: [01-philosophy](./01-philosophy.md) - 工匠工具定位*
*Related: [04-evolution](./04-evolution.md) - 维护窗口与生命周期*
