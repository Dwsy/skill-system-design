# 03 - Dependency: 依赖管理

> 管理复杂性，而非逃避复杂性。

## TL;DR

- **DAG 约束**：技能依赖图必须是有向无环图，禁止循环依赖
- **分层架构**：Foundation → Platform → Domain 三层，下层不依赖上层
- **版本协调**：语义化版本 + 锁定文件 + 冲突解决策略
- **依赖解析**：拓扑排序算法 + 版本范围匹配
- **运行时隔离**：不同版本的同名技能可以共存

---

## 为什么依赖管理如此重要？

### 真实世界的灾难

```yaml
场景: "项目依赖地狱"
项目A:
  依赖: "@acme/utils@^1.0.0"
  
项目B:
  依赖: "@acme/utils@^2.0.0"
  
问题:
  - 两个项目在同一个仓库
  - @acme/utils@1.x 和 @2.x 不兼容
  - 无法同时安装两个版本
  - 项目A或B必有一个无法运行
```

**传统方案的局限**：
- npm：嵌套 node_modules，磁盘爆炸
- Python：虚拟环境，切换麻烦
- Go：vendoring，版本混乱

### Skill System 的方案

```yaml
核心原则:
  - 明确的依赖图（DAG）
  - 版本严格隔离
  - 运行时按需加载
  - 冲突可解决
```

---

## DAG 约束

### 什么是有向无环图（DAG）？

```
DAG 示例（合法）：

    @acme/core
       │
       ├──→ @acme/tmux
       │       │
       │       └──→ @acme/deploy
       │
       └──→ @acme/git
               │
               └──→ @acme/deploy

非 DAG（非法，有循环）：

    @acme/a ──→ @acme/b
       ↑           │
       └───────────┘
       
    循环依赖！@acme/a 依赖 b，b 又依赖 a
```

### 为什么禁止循环依赖？

```yaml
循环依赖的问题:
  构建时: "无法确定构建顺序"
  运行时: "初始化死锁"
  维护时: "无法理解依赖关系"
  
示例:
  @acme/auth 依赖 @acme/session
  @acme/session 依赖 @acme/auth
  
  结果:
    - 先安装 auth？session 还没准备好
    - 先安装 session？auth 还没准备好
    - 死锁！
```

### DAG 检测算法

```typescript
interface SkillNode {
  name: string;
  version: string;
  dependencies: string[];
}

class DAGValidator {
  // 拓扑排序检测
  validate(graph: Map<string, SkillNode>): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const [name, node] of graph) {
      if (this.hasCycle(node, graph, visited, recursionStack)) {
        const cycle = this.findCycle(node, graph);
        throw new CircularDependencyError(cycle);
      }
    }
    
    return true;
  }
  
  private hasCycle(
    node: SkillNode,
    graph: Map<string, SkillNode>,
    visited: Set<string>,
    stack: Set<string>
  ): boolean {
    visited.add(node.name);
    stack.add(node.name);
    
    for (const depName of node.dependencies) {
      const dep = graph.get(depName);
      if (!dep) continue;
      
      if (!visited.has(depName)) {
        if (this.hasCycle(dep, graph, visited, stack)) {
          return true;
        }
      } else if (stack.has(depName)) {
        // 发现回边，存在循环
        return true;
      }
    }
    
    stack.delete(node.name);
    return false;
  }
  
  // 找出循环路径
  private findCycle(node: SkillNode, graph: Map<string, SkillNode>): string[] {
    // DFS 找出循环路径
    const path: string[] = [];
    const visited = new Set<string>();
    
    const dfs = (current: SkillNode): boolean => {
      if (path.includes(current.name)) {
        // 找到循环
        const cycleStart = path.indexOf(current.name);
        return [...path.slice(cycleStart), current.name];
      }
      
      if (visited.has(current.name)) return false;
      visited.add(current.name);
      path.push(current.name);
      
      for (const depName of current.dependencies) {
        const dep = graph.get(depName);
        if (dep && dfs(dep)) return true;
      }
      
      path.pop();
      return false;
    };
    
    return dfs(node) || [];
  }
}
```

### CLI 错误提示

```bash
$ pi skill install @acme/a

❌ 检测到循环依赖！

循环路径：
  @acme/a → @acme/b → @acme/c → @acme/a

解决建议：
  1. 联系 skill 作者重构依赖关系
  2. 使用旧版本（可能不包含循环）
  3. 寻找替代 skill

详细信息：
  - @acme/a@1.2.3 依赖 @acme/b@^2.0.0
  - @acme/b@2.1.0 依赖 @acme/c@^1.0.0
  - @acme/c@1.5.0 依赖 @acme/a@^1.0.0
```

---

## 分层架构

### 三层模型

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Domain（领域层）                               │
│  - 具体业务场景的技能                                     │
│  - 依赖下层，被上层依赖                                   │
│  示例: @acme/deploy, @acme/lint, @acme/test            │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Platform（平台层）                             │
│  - 跨领域的通用能力                                       │
│  - 依赖 Foundation，被 Domain 依赖                       │
│  示例: @acme/tmux, @acme/git, @acme/docker             │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Foundation（基础层）                           │
│  - 最基础的通用能力                                       │
│  - 不依赖任何其他技能                                     │
│  示例: @acme/core, @acme/utils, @acme/logger           │
└─────────────────────────────────────────────────────────┘
```

### 依赖方向规则

```yaml
分层依赖规则:
  rule_1: "下层不能依赖上层"
    示例: "@acme/core 不能依赖 @acme/deploy"
    原因: "基础层必须独立"
    
  rule_2: "同层避免循环"
    示例: "@acme/tmux 和 @acme/git 不应互相依赖"
    原因: "保持层内解耦"
    例外: "通过 Foundation 中转"
    
  rule_3: "跨层依赖必须显式声明"
    示例: "metadata.json 中声明 layer 字段"
    原因: "便于静态检查"
```

### metadata.json 分层声明

```json
{
  "name": "@acme/deploy",
  "layer": "domain",
  "allowed_dependencies": ["platform", "foundation"],
  "dependencies": {
    "@acme/tmux": "^2.0.0",
    "@acme/core": "^1.0.0"
  }
}
```

### 分层检查工具

```bash
$ pi skill lint @acme/deploy

检查分层依赖...
✓ @acme/tmux (platform) → 允许
✓ @acme/core (foundation) → 允许
✓ 无同层循环依赖

分层结构：
  foundation: @acme/core
  platform: @acme/tmux
  domain: @acme/deploy (当前)
```

---

## 版本协调

### 语义化版本（Semver）

```
版本格式：MAJOR.MINOR.PATCH

MAJOR：破坏性变更（ incompatible API ）
  示例: 1.0.0 → 2.0.0
  说明: 配置文件格式改变，需要手动迁移
  
MINOR：新功能，向后兼容
  示例: 1.0.0 → 1.1.0
  说明: 新增子命令，旧配置仍可用
  
PATCH：bugfix，完全兼容
  示例: 1.0.0 → 1.0.1
  说明: 修复崩溃，无行为变更
```

### 版本范围语法

```yaml
版本约束语法:
  exact: "1.2.3"
    含义: "精确匹配 1.2.3"
    
  caret: "^1.2.3"
    含义: ">=1.2.3 <2.0.0"
    适用: "信任 minor 更新"
    
  tilde: "~1.2.3"
    含义: ">=1.2.3 <1.3.0"
    适用: "只接受 patch"
    
  range: ">=1.0.0 <2.0.0"
    含义: "自定义范围"
    适用: "精确控制"
    
  wildcard: "1.x"
    含义: ">=1.0.0 <2.0.0"
    适用: "跟随 major 版本"
```

### 版本解析算法

```typescript
class VersionResolver {
  // 解析版本范围到具体版本
  resolve(
    range: string,
    available: string[]
  ): string | null {
    const sorted = available
      .sort((a, b) => this.compareVersions(b, a)); // 降序
    
    for (const version of sorted) {
      if (this.satisfies(version, range)) {
        return version;
      }
    }
    
    return null;
  }
  
  // 检查版本是否满足范围
  satisfies(version: string, range: string): boolean {
    const v = this.parseVersion(version);
    
    if (range.startsWith('^')) {
      // ^1.2.3 → >=1.2.3 <2.0.0
      const base = this.parseVersion(range.slice(1));
      return this.gte(v, base) && v.major < base.major + 1;
    }
    
    if (range.startsWith('~')) {
      // ~1.2.3 → >=1.2.3 <1.3.0
      const base = this.parseVersion(range.slice(1));
      return this.gte(v, base) && 
             (v.major < base.major || 
              (v.major === base.major && v.minor < base.minor + 1));
    }
    
    // 精确匹配
    return version === range;
  }
  
  private parseVersion(v: string): { major: number; minor: number; patch: number } {
    const [major, minor, patch] = v.split('.').map(Number);
    return { major, minor, patch };
  }
  
  private compareVersions(a: string, b: string): number {
    const va = this.parseVersion(a);
    const vb = this.parseVersion(b);
    
    if (va.major !== vb.major) return va.major - vb.major;
    if (va.minor !== vb.minor) return va.minor - vb.minor;
    return va.patch - vb.patch;
  }
}
```

---

## 依赖解析流程

### 完整流程

```yaml
dependency_resolution:
  step_1_parse:
    action: "解析根项目的依赖声明"
    input: "skills.json / skills.lock"
    output: "依赖列表 [{name, range}]"
    
  step_2_fetch:
    action: "获取所有可用版本"
    input: "依赖列表"
    output: "版本映射 {name: [versions]}"
    source: "registry + 本地缓存"
    
  step_3_resolve:
    action: "版本冲突解决"
    algorithm: " SAT solver / 回溯算法"
    output: "精确版本映射 {name: exact_version}"
    
  step_4_validate:
    action: "DAG 验证"
    check: "循环依赖检测"
    output: "无循环的依赖图"
    
  step_5_sort:
    action: "拓扑排序"
    output: "安装顺序列表"
    
  step_6_install:
    action: "按顺序安装"
    note: "下层先安装，上层后安装"
```

### 版本冲突解决

```yaml
冲突场景:
  项目依赖:
    - "@acme/utils": "^1.0.0"
    - "@acme/deploy": "^2.0.0"
    
  问题:
    - @acme/deploy@2.0.0 依赖 @acme/utils@^2.0.0
    - 项目要求 @acme/utils@^1.0.0
    - 冲突！无法同时满足

解决策略:
  strategy_1:
    name: "尝试找兼容版本"
    action: "检查是否有 @acme/utils 版本同时满足 ^1.0.0 和 ^2.0.0"
    result: "通常不可能，因为 major 版本不兼容"
    
  strategy_2:
    name: "升级项目依赖"
    action: "将项目依赖升级到 ^2.0.0"
    risk: "可能破坏项目其他部分"
    
  strategy_3:
    name: "降级 skill"
    action: "找 @acme/deploy@1.x（依赖 utils@^1.0.0）"
    risk: "可能缺少新功能"
    
  strategy_4:
    name: "版本隔离"
    action: "同时安装 utils@1.x 和 utils@2.x"
    note: "需要运行时隔离支持"
```

### CLI 冲突解决交互

```bash
$ pi skill install

⚠️  检测到版本冲突：

你的项目依赖：
  @acme/utils: ^1.0.0

@acme/deploy@2.0.0 依赖：
  @acme/utils: ^2.0.0

冲突：无法同时满足 ^1.0.0 和 ^2.0.0

解决选项：
  1. 升级项目依赖到 ^2.0.0
     ✓ 使用最新版本
     ⚠️  可能破坏其他配置
     
  2. 降级 @acme/deploy 到 1.x
     ✓ 保持现有依赖
     ⚠️  缺少新功能
     
  3. 尝试版本隔离（实验性）
     ✓ 同时保留两个版本
     ⚠️  可能占用更多磁盘空间
     
  4. 查看详细依赖树
  
选择 (1/2/3/4): 
```

---

## 运行时隔离

### 版本共存

```yaml
版本隔离方案:
  npm_style:
    name: "嵌套 node_modules"
    problem: "磁盘爆炸，路径过长"
    
  pnpm_style:
    name: "内容可寻址存储 + 硬链接"
    advantage: "节省磁盘，快速安装"
    
  skill_system:
    name: "版本命名空间"
    implementation:
      - "每个版本独立目录"
      - "运行时按需加载"
      - "依赖注入指定版本"
```

### 运行时版本选择

```typescript
interface SkillLoader {
  // 加载指定版本的 skill
  load(
    name: string,
    version: string,
    context: ExecutionContext
  ): SkillInstance;
}

// 示例：不同技能使用不同版本的同一依赖
const deploySkill = loader.load('@acme/deploy', '2.0.0', {
  dependencies: {
    '@acme/utils': '2.1.0'  // deploy 使用 utils v2
  }
});

const lintSkill = loader.load('@acme/lint', '1.5.0', {
  dependencies: {
    '@acme/utils': '1.8.3'  // lint 使用 utils v1
  }
});

// 两个版本的 utils 同时存在于内存中
// 互不干扰
```

### 本地存储结构

```
~/.pi/skills/
├── @acme/
│   ├── utils/
│   │   ├── 1.8.3/              # lint 使用的版本
│   │   ├── 2.1.0/              # deploy 使用的版本
│   │   └── current -> 2.1.0/   # 默认版本（软链接）
```

---

## 锁定文件

### skills.lock 格式

```yaml
# .pi/skills.lock
# 自动生成的锁定文件，记录精确版本

lockfileVersion: 1

dependencies:
  "@acme/core":
    version: "1.5.2"
    resolved: "https://registry.pi.dev/@acme/core/-/1.5.2.tgz"
    integrity: "sha512-abc123..."
    
  "@acme/tmux":
    version: "2.1.8"
    resolved: "https://registry.pi.dev/@acme/tmux/-/2.1.8.tgz"
    integrity: "sha512-def456..."
    dependencies:
      "@acme/core": "^1.0.0"
      
  "@acme/deploy":
    version: "2.3.1"
    resolved: "https://registry.pi.dev/@acme/deploy/-/2.3.1.tgz"
    integrity: "sha512-ghi789..."
    dependencies:
      "@acme/tmux": "^2.0.0"
      "@acme/core": "^1.0.0"

# 依赖图（拓扑排序后）
installOrder:
  - "@acme/core@1.5.2"
  - "@acme/tmux@2.1.8"
  - "@acme/deploy@2.3.1"
```

### 锁定文件的使用场景

```bash
# 场景 1：生产环境部署
$ pi skill install --frozen-lockfile
# 严格按照锁定文件安装，确保可复现

# 场景 2：更新依赖
$ pi skill update
# 更新到最新兼容版本，并更新锁定文件

# 场景 3：添加新技能
$ pi skill install @acme/new-skill
# 解析新依赖，更新锁定文件

# 场景 4：审计
$ pi skill audit
# 检查锁定文件中的依赖是否有安全漏洞
```

---

## 最佳实践

### 对 Skill 开发者

1. **遵循 Semver**
   ```yaml
   patch: bugfix
   minor: 新功能（向后兼容）
   major: 破坏性变更
   ```

2. **最小依赖原则**
   ```yaml
   # 不要过度依赖
   dependencies:
     # 必需
     "@acme/core": "^1.0.0"
     
     # 避免
     # "@acme/full-suite": "^10.0.0"  # 引入大量无用依赖
   ```

3. **分层声明**
   ```json
   {
     "layer": "platform",
     "allowed_dependencies": ["foundation"]
   }
   ```

### 对 Skill 用户

1. **使用锁定文件**
   ```bash
   # 提交锁定文件到版本控制
   git add .pi/skills.lock
   ```

2. **定期更新**
   ```bash
   # 检查更新
   pi skill outdated
   
   # 更新并测试
   pi skill update --dry-run
   pi skill update
   pi test
   ```

3. **审计依赖**
   ```bash
   # 检查安全漏洞
   pi skill audit
   
   # 查看依赖树
   pi skill tree
   ```

---

## 总结

**依赖管理的核心原则**：

1. **DAG 约束**：禁止循环依赖，保持依赖图清晰
2. **分层架构**：下层稳定，上层灵活
3. **版本语义**：Semver 约定，精确控制
4. **锁定文件**：可复现安装，生产安全
5. **运行时隔离**：版本共存，互不干扰

**技术组合**：
- 拓扑排序：确定安装顺序
- SAT 求解：版本冲突解决
- 内容可寻址：节省磁盘空间
- 命名空间隔离：运行时版本共存

**最终目标**：
> 让复杂的依赖关系变得清晰、可控、可预测。

---

*Related: [02-architecture](./02-architecture.md) - 安装机制*
*Related: [05-privacy](./05-privacy.md) - 供应链安全*