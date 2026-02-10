// Guardrails 类型定义

export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  category: 'safety' | 'security' | 'quality' | 'compliance';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  check: (context: CheckContext) => Promise<CheckResult>;
  fix?: (context: CheckContext) => Promise<FixResult>;
}

export interface CheckContext {
  cwd: string;
  config: GuardrailsConfig;
  files: string[];
  git?: GitInfo;
}

export interface CheckResult {
  passed: boolean;
  message: string;
  details?: string[];
  suggestions?: string[];
}

export interface FixResult {
  success: boolean;
  message: string;
  backup?: string;
}

export interface GuardrailsConfig {
  version: string;
  rules: Record<string, RuleConfig>;
  presets: string[];
}

export interface RuleConfig {
  enabled: boolean;
  severity?: 'error' | 'warning' | 'info';
  options?: Record<string, unknown>;
}

export interface GitInfo {
  branch: string;
  isClean: boolean;
  remoteUrl?: string;
}

export interface AuditReport {
  timestamp: string;
  cwd: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: RuleResult[];
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  passed: boolean;
  message: string;
  details?: string[];
}
