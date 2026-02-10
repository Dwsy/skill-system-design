// Guardrails Core Types - Unified Version

// ==================== Configuration ====================

export interface GuardrailsConfig {
  version: string;
  rules: RuleDefinition[];
  settings?: {
    autoFix?: boolean;
    failOnWarning?: boolean;
  };
}

// ==================== Rule Definitions ====================

export type RuleType = 
  | 'command_intercept' 
  | 'tool_check' 
  | 'file_check' 
  | 'env_check' 
  | 'pre_commit'
  | 'git_hook';

export interface RuleDefinition {
  id: string;
  type: RuleType;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  message: string;
  suggestion?: string;
  
  // Command intercept specific (supports both pattern and target)
  pattern?: string;
  target?: string;
  action?: 'redirect' | 'block' | 'confirm' | 'suggest';
  to?: string;
  condition?: string;
  
  // Tool check specific
  alternatives?: string[];
  
  // File check specific
  path?: string;
  
  // Pre-commit specific
  command?: string;
  
  // Additional guardrail options
  whitelist?: string[];
  require_explicit?: boolean;
}

// ==================== Check Results ====================

export interface CheckOptions {
  rules?: string[];
  fix?: boolean;
}

export interface CheckResults {
  violations: Violation[];
  warnings: Violation[];
  checked: number;
  passed: number;
  timestamp: string;
}

export interface Violation {
  rule: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  fixable: boolean;
}

// ==================== Audit ====================

export interface AuditReport {
  metadata: {
    project: string;
    timestamp: string;
    guardrailsVersion: string;
    configVersion: string;
  };
  summary: {
    totalRules: number;
    violations: number;
    warnings: number;
    passed: number;
  };
  violations: Violation[];
  warnings: Violation[];
  recommendations: string[];
}

// ==================== Skill System ====================

export interface SkillMetadata {
  name: string;
  version: string;
  type: 'guardrail' | 'utility' | 'integration';
  description: string;
  author: string;
  
  // Entry points
  entry?: {
    rules?: string;
  };
  
  // Legacy format (KeenDragon's)
  guardrails?: {
    rules: GuardrailRule[];
    hooks: string[];
    config: {
      schema: string;
      defaults: string;
    };
  };
  
  // Unified rule list
  rules?: RuleDefinition[];
  
  // Config
  config?: {
    schema?: string;
    defaults?: string;
  };
  
  engines?: {
    guardrails: string;
  };
}

// Legacy rule format
export interface GuardrailRule {
  id: string;
  type: RuleType;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  
  // command_intercept
  target?: string;
  pattern?: string;
  action?: 'redirect' | 'block' | 'confirm' | 'suggest';
  to?: string;
  
  // file_check
  path?: string;
  condition?: 'exists' | 'not_exists' | 'readable' | 'writable';
  
  // tool_check
  tool?: string;
  alternatives?: string[];
  
  // Additional
  whitelist?: string[];
  require_explicit?: boolean;
}

// ==================== Runtime Types ====================

export interface RuleContext {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface GuardrailResult {
  action: 'ALLOW' | 'BLOCK' | 'WARN';
  ruleId: string;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'info';
  requireExplicit?: string;
  fixable?: boolean;
}

export interface SkillConfig {
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  whitelist?: string[];
  require_explicit?: boolean;
  [key: string]: any;
}

export interface InstalledSkill {
  metadata: SkillMetadata;
  config: SkillConfig;
  rules: Rule[];
}

export interface Rule {
  definition: RuleDefinition;
  check(context: RuleContext): Promise<GuardrailResult | null>;
}

// ==================== Fix Types ====================

export interface FixOptions {
  dryRun?: boolean;
}

export interface FixResults {
  applied: number;
  skipped: number;
  failed: number;
  details: FixDetail[];
}

export interface FixDetail {
  rule: string;
  original: string;
  replacement: string;
  status: 'applied' | 'skipped' | 'failed';
  error?: string;
}
