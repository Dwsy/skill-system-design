# 02 - Architecture: 技能系统架构

> 从单个技能包到完整生态的技术蓝图。

## TL;DR

- **技能包结构**：SKILL.md + metadata.json + 可执行文件的标准化组织
- **Registry 设计**：中心化索引 + 分布式存储的混合架构
- **安装机制**：本地优先、版本锁定、依赖解析的完整流程
- **CLI 接口**：简洁一致的命令设计，符合工匠使用习惯

---

## 技能包结构

### 标准目录布局

```
@acme/deploy/                          # 技能包根目录（命名：@scope/name）
├── SKILL.md                           # 技能文档（必须）
├── metadata.json                      # 元数据（必须）
├── evolution.yml                      # 演化配置（推荐）
├── bin/                               # 可执行入口
│   ├── deploy                         # 主命令（无扩展名，可执行）
│   ├── rollback                       # 子命令
│   └── status                         # 子命令
├── lib/                               # 内部实现
│   ├── index.js
│   ├── kubernetes.js
│   └── validators.js
├── config/                            # 默认配置
│   ├── default.yml
│   └── schema.json                    # 配置校验模式
├── templates/                         # 模板文件
│   ├── deployment.yml
│   └── service.yml
└── tests/                             # 测试用例
    ├── integration/
    └── unit/
```

### metadata.json 规范

```json
{
  "name": "@acme/deploy",
  "version": "1.2.3",
  "description": "部署到 Kubernetes 的专业工具",
  "keywords": ["deploy", "kubernetes", "k8s", "devops"],
  
  "author": {
    "name": "ACME Team",
    "email": "team@acme.io",
    "url": "https://acme.io"
  },
  
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/acme/skills/tree/main/deploy"
  },
  
  "entry": {
    "command": "bin/deploy",
    "subcommands": ["rollback", "status"]
  },
  
  "dependencies": {
    "@acme/core": "^1.0.0",
    "@acme/tmux": "~2.1.0"
  },
  
  "peerDependencies": {
    "kubectl": ">=1.25.0",
    "docker": ">=20.0.0"
  },
  
  "engines": {
    "pi": ">=2.0.0",
    "node": ">=18.0.0"
  },
  
  "config": {
    "schema": "config/schema.json",
    "defaults": "config/default.yml"
  },
  
  "telemetry": {
    "level": 2,
    "purpose": "帮你优化部署流程"
  }
}
```

### SKILL.md 文档规范

采用「倒金字塔」结构，遵循 [01-philosophy](./01-philosophy.md) 的工匠视角。

> **文档结构标准**：TL;DR → When to Use → Quick Start → Advanced → Configuration → Troubleshooting → Changelog
>
> 详见 [01-philosophy#skillmd-文档规范](./01-philosophy.md#skillmd-文档规范)

```markdown
# @acme/deploy

> 一键部署到 Kubernetes，支持蓝绿发布和自动回滚。

## TL;DR（30秒上手）

```bash
# 安装
pi skill install @acme/deploy

# 配置
pi skill config @acme/deploy set cluster.name=production

# 部署
pi run deploy ./my-app
```

## When to Use（何时使用）

- ✅ 部署到 Kubernetes 集群
- ✅ 需要蓝绿发布或金丝雀发布
- ✅ 需要自动健康检查和回滚
- ❌ 本地开发测试（用 @acme/local-dev 更合适）

## Quick Start（5分钟跑通）

### 1. 前置要求

```bash
# 确保 kubectl 已配置
kubectl config current-context

# 确保有权限创建 deployment
kubectl auth can-i create deployments
```

### 2. 初始化配置

```bash
pi skill config @acme/deploy init
# 交互式配置向导
```

### 3. 首次部署

```bash
pi run deploy ./k8s-manifests --env=production
```

### 4. 验证部署

```bash
pi run status --watch
```

## Advanced（进阶用法）

### 蓝绿发布

```bash
pi run deploy --strategy=blue-green --traffic-split=10:90
```

### 自动回滚

```yaml
# ~/.pi/config/@acme/deploy.yml
auto_rollback:
  enabled: true
  health_check:
    endpoint: "/health"
    interval: "10s"
    timeout: "5m"
```

### 自定义钩子

```yaml
hooks:
  pre_deploy: "npm run test:integration"
  post_deploy: "notify-slack 'Deployment complete'"
```

## Configuration（完整配置）

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| `cluster.name` | string | - | 目标集群名称 |
| `cluster.namespace` | string | "default" | 目标命名空间 |
| `strategy` | enum | "rolling" | 部署策略 |
| `auto_rollback.enabled` | boolean | false | 是否启用自动回滚 |

## Troubleshooting（常见问题）

### 部署失败：权限不足

```bash
# 检查权限
kubectl auth can-i create deployments

# 申请权限
kubectl apply -f rbac.yml
```

### 镜像拉取失败

```bash
# 检查镜像仓库权限
pi run deploy --image-pull-secret=my-secret
```

## Changelog（更新日志）

### v1.2.3

- 新增：支持 Helm Chart 部署
- 改进：蓝绿发布切换速度提升 50%
- 修复：修复 namespace 不存在时的报错

### v1.2.2

- 修复：自动回滚阈值计算错误
```

---

## Registry 架构

### 混合架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      Registry 架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Central    │◄────►│   Index      │                    │
│  │   Registry   │      │   Service    │                    │
│  │  (Metadata)  │      │  (Search/API) │                    │
│  └──────────────┘      └──────────────┘                    │
│          ▲                       ▲                          │
│          │                       │                          │
│          │    ┌──────────────────┘                          │
│          │    │                                               │
│          │    ▼                                               │
│  ┌───────┴────────┐      ┌──────────────┐                    │
│  │  Distributed   │      │   GitHub     │                    │
│  │    Storage     │      │  Releases    │                    │
│  │ (IPFS/S3/etc)  │      │              │                    │
│  └────────────────┘      └──────────────┘                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Client (pi CLI)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Central Registry 职责

```yaml
# 中心化索引存储的内容
index_entry:
  name: "@acme/deploy"
  versions:
    "1.2.3":
      metadata_url: "https://registry.pi.dev/@acme/deploy/1.2.3/metadata.json"
      tarball_url: "https://github.com/acme/skills/releases/download/v1.2.3/deploy-1.2.3.tgz"
      checksum: "sha256:abc123..."
      dependencies:
        "@acme/core": "^1.0.0"
      published_at: "2024-01-15T10:30:00Z"
      
  tags:
    "latest": "1.2.3"
    "stable": "1.2.2"
    "beta": "1.3.0-beta.1"
    
  stats:
    downloads: 15023
    stars: 342
    updated_at: "2024-02-10T08:15:00Z"
```

### 分布式存储选项

| 存储方式 | 适用场景 | 优点 | 缺点 |
|---------|---------|------|------|
| GitHub Releases | 开源技能 | 免费、版本控制 | 国内访问慢 |
| NPM Registry | Node.js 技能 | 生态成熟 | 需适配技能格式 |
| IPFS | 去中心化 | 抗审查、永久存储 | 技术门槛高 |
| 私有 S3 | 企业内网 | 完全控制 | 需自建基础设施 |
| 本地文件 | 开发调试 | 即时反馈 | 无法共享 |

---

## 安装机制

### 安装流程

```yaml
install_workflow:
  # 1. 解析版本
  resolve:
    input: "@acme/deploy@^1.2.0"
    output: "@acme/deploy@1.2.3"  # 解析到最新兼容版本
    
  # 2. 检查缓存
  cache_check:
    hit: "使用本地缓存"
    miss: "继续下载"
    
  # 3. 下载依赖
  download:
    - 下载技能包
    - 校验完整性 (checksum)
    - 解压到 ~/.pi/skills/@acme/deploy/1.2.3/
    
  # 4. 解析依赖树
  resolve_dependencies:
    tree:
      "@acme/deploy@1.2.3":
        - "@acme/core@1.5.2"
        - "@acme/tmux@2.1.8"
    
  # 5. 安装依赖
  install_deps:
    - 递归安装每个依赖
    - 检测循环依赖
    - 处理版本冲突
    
  # 6. 配置初始化
  init_config:
    - 复制默认配置
    - 运行配置向导（如需要）
    
  # 7. 验证安装
  verify:
    - 检查入口文件可执行
    - 运行健康检查
    - 测试基本功能
```

### 依赖解析算法

```typescript
interface DependencyGraph {
  nodes: Map<string, SkillNode>;
  edges: Map<string, string[]>; // skill -> dependencies
}

class DependencyResolver {
  resolve(requested: string[]): ResolvedGraph {
    const graph: DependencyGraph = { nodes: new Map(), edges: new Map() };
    
    for (const req of requested) {
      this.resolveNode(req, graph, new Set());
    }
    
    // 检测循环依赖
    if (this.hasCycle(graph)) {
      throw new CircularDependencyError(this.findCycle(graph));
    }
    
    // 拓扑排序
    return this.topologicalSort(graph);
  }
  
  private resolveNode(
    name: string, 
    graph: DependencyGraph, 
    path: Set<string>
  ): void {
    if (path.has(name)) {
      throw new CircularDependencyError([...path, name]);
    }
    
    const metadata = this.fetchMetadata(name);
    const resolvedVersion = this.resolveVersion(metadata);
    
    graph.nodes.set(name, {
      name,
      version: resolvedVersion,
      metadata
    });
    
    path.add(name);
    
    for (const [depName, range] of Object.entries(metadata.dependencies)) {
      this.resolveNode(depName, graph, path);
    }
    
    path.delete(name);
  }
  
  private resolveVersion(metadata: Metadata): string {
    // 语义化版本解析
    // 优先使用 skills.lock 中的锁定版本
    // 其次解析最新兼容版本
  }
}
```

### 版本冲突处理

> 详见 [03-dependency](./03-dependency.md) 的完整依赖协调策略。

```yaml
# 场景：skill-a 依赖 lodash@^4.0.0，skill-b 依赖 lodash@^3.0.0
conflict_resolution:
  strategy:
    # 策略 1：尝试找共同兼容版本
    - attempt: "find_compatible"
      
    # 策略 2：提示用户选择
    - attempt: "prompt_user"
      options:
        - "安装 lodash@4.17.0 (可能破坏 skill-b)"
        - "安装 lodash@3.10.0 (可能破坏 skill-a)"
        - "安装两个版本（隔离运行）"
        - "取消安装"
        
    # 策略 3：强制安装（--force）
    - attempt: "force_install"
      warning: "可能产生不可预期行为"
```

---

## CLI 设计

### 命令结构

```
pi skill [action] [target] [options]

Actions:
  install    安装技能
  uninstall  卸载技能
  update     更新技能
  list       列出已安装技能
  search     搜索技能
  config     配置技能
  health     健康检查
  info       查看技能详情
  export     导出技能配置
  import     导入技能配置
```

### 命令示例

```bash
# 搜索技能
$ pi skill search "deploy kubernetes"
┌─────────────────┬─────────┬───────────┬──────────────────────┐
│ Name            │ Version │ Downloads │ Description          │
├─────────────────┼───────────┼─────────┼──────────────────────┤
│ @acme/deploy    │ 1.2.3   │ 15,023    │ K8s 部署专家         │
│ @kube/simple    │ 0.8.1   │ 3,421     │ 简化版 K8s 部署      │
│ @helm/chart     │ 2.1.0   │ 8,902     │ Helm Chart 管理      │
└─────────────────┴─────────┴───────────┴──────────────────────┘

# 安装技能
$ pi skill install @acme/deploy
✓ 下载 @acme/deploy@1.2.3
✓ 安装依赖 (2 packages)
✓ 初始化配置
✓ 健康检查通过
✓ 安装完成！运行 `pi run deploy --help` 开始使用

# 配置技能
$ pi skill config @acme/deploy set cluster.name=production
$ pi skill config @acme/deploy get cluster
{
  "name": "production",
  "namespace": "default"
}

# 更新技能
$ pi skill update @acme/deploy
发现新版本 1.3.0 (minor)
变更日志：
  - 新增：支持 Helm Chart 部署
  - 改进：蓝绿发布切换速度提升 50%
  
确认更新？(Y/n): Y
✓ 备份当前版本
✓ 下载新版本
✓ 迁移配置
✓ 更新完成

# 健康检查
$ pi skill health @acme/deploy
✓ kubectl: 1.28.2
✓ cluster: 可连接
⚠ namespace: production 不存在（将自动创建）
状态: HEALTHY

# 导出配置
$ pi skill export --all > my-toolkit.yml
# 可在其他机器导入
```

### 全局选项

```bash
pi skill [command] [options]

Options:
  --global, -g          全局安装（默认）
  --local, -l           本地安装（当前项目）
  --registry <url>      使用指定 registry
  --force               强制操作（忽略警告）
  --dry-run             模拟运行（不实际执行）
  --verbose, -v         详细输出
  --quiet, -q           静默模式
  --json                JSON 格式输出
```

---

## 本地存储结构

```
~/.pi/                                 # pi 主目录
├── skills/                            # 已安装技能
│   ├── @acme/
│   │   ├── deploy/
│   │   │   ├── 1.2.3/                # 具体版本
│   │   │   ├── 1.2.2/
│   │   │   └── current -> 1.2.3/     # 当前使用版本（软链接）
│   │   └── core/
│   │       └── 1.5.2/
│   └── @builtin/
│       └── git/
│
├── config/                            # 技能配置
│   └── @acme/
│       └── deploy.yml                 # 用户自定义配置
│
├── cache/                             # 缓存
│   ├── registry/                      # registry 元数据缓存
│   └── tarballs/                      # 下载的技能包缓存
│
├── locks/                             # 版本锁定
│   └── skills.lock                    # 全局锁定
│
├── backups/                           # 备份
│   └── @acme-deploy-1.2.3-20240210/   # 更新前自动备份
│
├── logs/                              # 日志
│   ├── telemetry.log                  # telemetry 审计日志
│   └── skill-operations.log           # 操作日志
│
└── registry/                          # 本地 registry 覆盖
    └── @local/                        # 本地开发的技能
```

---

## 安全设计

### 代码执行沙盒

```yaml
skill_sandbox:
  # 文件系统隔离
  filesystem:
    allowed_paths:
      - "~/.pi/skills/@acme/deploy/"    # 技能自身目录
      - "~/.pi/config/@acme/deploy/"     # 配置目录
      - "./"                              # 当前工作目录
    forbidden_paths:
      - "~/.ssh/"
      - "~/.aws/"
      - "~/.kube/config"                 # 需用户显式授权
      
  # 网络访问
  network:
    default: "deny"
    allowed:
      - "registry.pi.dev"
      - "api.github.com"
    
  # 环境变量
  environment:
    allowed: ["PATH", "HOME", "PI_*"]
    forbidden: ["AWS_*", "GITHUB_TOKEN"]
```

### 权限提示

```bash
# 首次运行需要敏感权限时
$ pi run deploy
⚠️  此技能需要以下权限：
  1. 读取 ~/.kube/config
  2. 执行 kubectl 命令
  3. 访问 https://api.production.cluster

授权？(Y/n/view-details): view-details

详细信息：
  - ~/.kube/config: 用于连接 K8s 集群
  - kubectl: 用于执行部署命令
  - api.production.cluster: 用于查询部署状态

(Y/n): Y
✓ 授权已保存，下次不再提示
```

---

## 扩展机制

### Hook 系统

```yaml
# 允许其他技能扩展当前技能
hooks:
  pre_deploy:
    - "@acme/security-scan"      # 安全扫描
    - "@acme/notify-slack"       # 发送通知
    
  post_deploy:
    - "@acme/smoke-test"         # 冒烟测试

# Hook 冲突检测
hook_resolution:
  strategy: "ordered"             # ordered / parallel / user-defined
  order:
    - "@acme/security-scan"      # 优先级高（安全检查优先）
    - "@acme/notify-slack"       # 优先级中
    - "@acme/metrics-collect"    # 优先级低
  
  # 冲突检测
  conflicts:
    - between: ["@acme/notify-slack", "@acme/notify-discord"]
      resolution: "prompt_user"   # 让用户选择用哪个
      # 或 "merge_outputs" - 合并输出
```

### 插件接口

```typescript
interface SkillPlugin {
  name: string;
  
  // 注册钩子
  hooks: {
    [event: string]: HookHandler[];
  };
  
  // 扩展 CLI
  commands?: CommandDefinition[];
  
  // 扩展配置
  configSchema?: JSONSchema;
}

// 插件示例
const securityPlugin: SkillPlugin = {
  name: "@acme/security-scan",
  
  hooks: {
    "pre_deploy": [
      async (context) => {
        const results = await scanForVulnerabilities(context.image);
        if (results.critical > 0) {
          throw new SecurityError("发现严重漏洞，禁止部署");
        }
      }
    ]
  }
};
```

---

## 最佳实践

### 技能开发者

1. **遵循标准结构**
   - SKILL.md 必须包含 TL;DR、When to Use、Quick Start
   - metadata.json 必须包含完整依赖声明

2. **版本语义化**
   - patch: bugfix，自动更新安全
   - minor: 新功能，向后兼容
   - major: 破坏性变更，需人工审核

3. **提供完整示例**
   ```bash
   # 示例项目
   examples/
   ├── basic/                    # 最小可运行示例
   ├── advanced/                 # 高级用法
   └── real-world/               # 真实项目案例
   ```

### 技能使用者

1. **版本锁定生产环境**
   ```yaml
   # .pi/skills.lock
   "@acme/deploy": "1.2.3"       # 精确锁定
   ```

2. **定期更新开发环境**
   ```bash
   pi skill update --all --dry-run  # 先看变更
   pi skill update --all            # 再更新
   ```

3. **备份自定义配置**
   ```bash
   pi skill export --all > backup-$(date +%Y%m%d).yml
   ```

---

## 总结

**技能系统架构的核心设计原则**：

1. **标准化**：统一的包结构、元数据格式、CLI 接口
2. **去中心化**：支持多种 registry 和存储后端
3. **本地优先**：完全离线运行，数据本地存储
4. **可组合**：依赖解析、hook 系统、插件机制
5. **安全可控**：沙盒执行、权限提示、审计日志

这套架构既保证了生态的开放性，又确保了工匠对工具的完全掌控。

---

*Next: [03-dependency](./03-dependency.md) - DAG 约束、分层架构、版本协调*
*Related: [01-philosophy](./01-philosophy.md) - 工匠工具定位*
*Related: [04-evolution](./04-evolution.md) - 技能演化机制*
