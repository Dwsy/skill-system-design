# 05 - Privacy: 隐私保护设计

> 在便利与隐私之间，选择「可验证的透明」。

## TL;DR

- **运行时隐私**：影子模式 + 声明式权限 + 行为审计日志
- **配置隐私**：分层存储（本地加密/环境注入/硬件密钥）
- **协作隐私**：公司/团队/个人三层边界，个人配置加密隔离
- **Registry 隐私**：查询匿名化 + 本地索引，不上传用户兴趣
- **供应链安全**：Provenance 追溯 + 可重现构建 + 社区审计
- **零知识技能**：WASM 沙盒 → 形式化验证 → ZK 证明的渐进路线

---

## Registry Privacy（Registry 隐私）

### 问题：Registry 如何保护用户查询隐私？

传统包管理器的问题：
- npm 搜索记录用户 IP 和查询关键词
- 用于「改善服务」实则是用户画像
- 泄露开发者技术栈和项目信息

### 解决方案

#### 1. 查询匿名化

```yaml
registry_query_privacy:
  # 不记录身份与查询的关联
  identity_isolation:
    - 查询不携带用户 ID
    - 使用临时 session token（24小时过期）
    - 支持 Tor 代理访问
    
  # 差分隐私统计
  differential_privacy:
    - 聚合数据添加噪声（epsilon < 1.0）
    - 不暴露个体查询模式
    - 公开统计报告供验证
    
  # 无日志承诺
  no_log_policy:
    - 访问日志 24 小时内删除
    - 仅保留聚合统计数据
    - 第三方审计验证无日志
```

#### 2. 本地索引

```bash
# 定期同步 registry 索引到本地
$ pi registry sync
下载索引: 15,243 packages (2.3 MB)
本地索引已更新: ~/.pi/registry/index.json

# 本地搜索，不上传查询
$ pi skill search "kubernetes"
# 完全离线搜索本地索引
```

**优势**：
- 搜索关键词不上传
- 支持离线浏览技能
-  faster 查询（本地索引）

#### 3. 匿名发布

```yaml
# 开发者可以匿名发布技能
anonymous_publish:
  - 使用临时密钥对签名
  - 无需关联真实身份
  - 通过社区声誉建立信任
  - 支持 Tor 隐藏服务发布
```

---

## Supply Chain Security（供应链安全）

### 问题：如何确保 skill 来自可信来源？

```
攻击场景:
1. 中间人攻击：篡改下载的 skill 包
2. 构建时攻击：作者在构建时注入恶意代码
3. 账号劫持：攻击者控制作者账号发布恶意版本
4. 依赖混淆：上传与官方 skill 相似的恶意包
```

### 解决方案：SLSA 框架适配

#### 1. Provenance（来源追溯）

```json
{
  "skill": "@acme/deploy",
  "version": "1.2.3",
  "slsa_provenance": {
    "builder": {
      "id": "https://github.com/acme/skills/.github/workflows/release.yml@refs/heads/main",
      "version": "1.0.0"
    },
    "buildType": "https://slsa.dev/github-actions-workflow/v1",
    "invocation": {
      "configSource": {
        "uri": "git+https://github.com/acme/skills@refs/tags/v1.2.3",
        "digest": {
          "sha256": "abc123..."
        },
        "entryPoint": ".github/workflows/release.yml"
      },
      "parameters": {
        "build_target": "production",
        "signed": true
      }
    },
    "materials": [
      {
        "uri": "git+https://github.com/acme/skills",
        "digest": {
          "sha256": "def456..."
        }
      }
    ]
  }
}
```

#### 2. 可重现构建（Reproducible Builds）

```bash
# 任何人都可以验证构建一致性
$ git clone https://github.com/acme/skills
$ cd skills/deploy
$ git checkout v1.2.3

# 使用相同的构建环境
$ pi build --reproduce
构建环境:
  - OS: ubuntu-22.04
  - Node: 18.17.0
  - Build tool: pi-builder@2.1.0

输出哈希: sha256:abc123...
与发布版本比对: ✓ 完全一致
```

**可重现构建的要求**：
- 锁定的构建环境（Docker 镜像）
- 确定的依赖版本
- 无时间戳或随机数
- 排序一致的文件列表

#### 3. 签名验证

```yaml
signature_verification:
  # 作者签名
  author_sign:
    key: "@acme/public-key.asc"
    trust: "community-verified"
    
  # 构建器签名（CI/CD）
  builder_sign:
    key: "github-actions@pi.dev"
    trust: "infrastructure"
    
  # 社区审计签名
  auditor_sign:
    key: ["@security-team-1", "@security-team-2"]
    trust: "requires-2-of-3"
    
  # 验证策略
  policy:
    - "必须包含作者签名"
    - "推荐使用构建器签名"
    - "高敏感技能需要审计签名"
```

#### 4. 依赖混淆防护

```yaml
dependency_confusion_protection:
  # 命名空间验证
  namespace_check:
    "@acme/":
      - 必须来自 github.com/acme
      - 必须由 @acme 成员签名
      
  # 相似名称检测
  similar_name_detection:
    - "@acme/deploy" vs "@acme_/deploy" (下划线混淆)
    - "@acme/deploy" vs "@acme-depl0y" (字符替换)
    
  # 安装前警告
  warning:
    "检测到你正在安装 @acme-depl0y，这可能是一个仿冒包。
     你是否想安装 @acme/deploy？"
```

---

## Community Audit（社区审计）

### Badge 系统

```yaml
audit_badges:
  alpha:
    level: "基础"
    requirements:
      - "作者自测通过"
      - "CI 自动化测试"
      - "基础安全检查"
    badge: "⚠️ 未审计"
    
  beta:
    level: "社区审计"
    requirements:
      - "2+ 社区志愿者 review"
      - "无高危漏洞"
      - "7天观察期"
    badge: "👁️ 社区审计"
    
  gold:
    level: "专业审计"
    requirements:
      - "专业安全公司审计"
      - "公开审计报告"
      - "90天观察期"
    badge: "🛡️ 专业审计"
    
  community:
    level: "众包审计"
    requirements:
      - "5+ 独立审计者"
      - "公开审计日志"
      - "漏洞赏金计划"
    badge: "🌟 社区验证"
```

### 激励设计

```yaml
incentive_mechanism:
  # 声誉系统
  reputation:
    - 审计者发现漏洞 → +rep
    - 审计者提供改进建议 → +rep
    - 技能被标记安全 → 作者 +rep
    
  # 赏金计划
  bounty:
    critical: "$5,000"
    high: "$2,000"
    medium: "$500"
    low: "$100"
    
  # 持续维护奖励
  maintenance:
    - 定期重新审计热门技能
    - 维护者获得持续奖励
    - 过时的审计 badge 自动降级
```

---

## Advanced: Zero-Knowledge Skills（零知识技能）

### 愿景

```
理想状态: skill 可以处理敏感数据，但无法泄露
  - 可以加密文件（需要读取内容）
  - 但无法将内容发送到外部（技术保证）
  - 无需信任 skill 作者
```

### 渐进式实现路线

#### Tier 1: WASM 沙盒（当前可行）

```yaml
wasm_sandbox:
  tech: "WASM + WASI capability-based security"
  guarantee: "skill 无法访问未授权的资源"
  
  capabilities:
    - "文件系统: 只读 ./input/, 只写 ./output/"
    - "网络: 禁止所有出站连接"
    - "环境变量: 只允许 READONLY_PATH"
    
  runtime:
    wasmtime: "WebAssembly 运行时"
    wasi: "WebAssembly System Interface"
    capabilities: "基于能力的权限模型"
```

**示例**：
```bash
# 在 WASM 沙盒中运行 skill
$ pi run encrypt --wasm --no-network --readonly-input --write-output

沙盒限制:
  ✓ 可以读取 ./input/secret.txt
  ✓ 可以写入 ./output/encrypted.bin
  ✗ 无法连接网络
  ✗ 无法访问 ~/.ssh/
  ✗ 无法读取环境变量（除显式允许的）
```

#### Tier 2: 形式化验证（2-3年）

```yaml
formal_verification:
  tech: "Rust + contracts + 符号执行"
  guarantee: "证明 skill 不会泄露数据"
  
  approach:
    - 使用 Rust 编写 skill（内存安全）
    - 添加形式化契约（pre/post conditions）
    - 使用 Kani/Mirai 进行符号执行
    - 证明："如果输入是秘密，则输出不会泄露"
    
  cost: "高（需要形式化方法专家）"
  use_case: "高敏感场景（金融、医疗）"
```

#### Tier 3: 零知识证明（5年+）

```yaml
zero_knowledge_proof:
  tech: "zk-SNARKs / zk-STARKs"
  guarantee: "skill 执行正确性可验证，但不暴露输入"
  
  concept:
    - skill 逻辑编译为 zk-circuit
    - 用户本地执行，生成证明
    - 验证者验证证明（无需知道输入）
    - 保证："执行了正确的加密逻辑"
    
  cost: "极高（密码学 overhead 很大）"
  status: "研究方向"
```

#### Tier 4: 安全飞地（硬件支持）

```yaml
secure_enclave:
  tech: "Intel SGX / AMD SEV / AWS Nitro Enclaves"
  guarantee: "即使操作系统被攻破，skill 数据仍安全"
  
  workflow:
    1. skill 在 enclave 中加载
    2. 远程证明验证 enclave 真实性
    3. 数据传输到 enclave（加密通道）
    4. skill 在 enclave 中处理数据
    5. 结果返回（外部无法窥探）
    
  cost: "中等（依赖硬件支持）"
  limitation: "并非所有机器支持 SGX/SEV"
```

### 务实的建议

```yaml
recommendation:
  default: "Tier 1 (WASM 沙盒)"
  high_security: "Tier 1 + Tier 4 (WASM + Enclave)"
  future: "Tier 2 (形式化验证) 逐步引入"
  research: "Tier 3 (ZK Proof) 持续跟踪"
```

---

## 隐私设计原则总结

### 1. 本地优先

```yaml
本地优先:
  - 索引本地存储
  - 搜索本地执行
  - 配置本地加密
  - 审计日志本地保留
```

### 2. 透明可验证

```yaml
透明可验证:
  - 开源所有代码
  - 可重现构建
  - 社区审计
  - 行为可审计（影子模式）
```

### 3. 用户掌控

```yaml
用户掌控:
  - 选择 telemetry 级别
  - 选择信任级别（alpha/beta/gold）
  - 随时退出/删除数据
  - 自主决定权限授予
```

### 4. 分层安全

```yaml
分层安全:
  - 根据敏感度选择安全级别
  - 不强迫所有人用最高级别（性能成本）
  - 渐进式采用
  - 教育用户理解 trade-off
```

---

## 与其他章节的关联

- **02-architecture**: 沙盒设计、权限系统
- **04-evolution**: telemetry 分级、隐私沙盒
- **06-business**: 隐私作为差异化卖点

---

*Next: [06-business](./06-business.md) - 分层工匠经济、定价策略*
*Related: [02-architecture](./02-architecture.md) - 安全沙盒设计*
*Related: [04-evolution](./04-evolution.md) - telemetry 分级*
