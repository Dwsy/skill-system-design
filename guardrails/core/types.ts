// Guardrails Core Types

export interface GuardrailsConfig {
  version: string;
  rules: RuleDefinition[];
  settings?: {
    autoFix?: boolean;
    failOnWarning?: boolean;
  };
}

export interface RuleDefinition {
  id: string;
  type: 'command_intercept' | 'tool_check' | 'file_check' | 'env_check' | 'pre_commit';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  message: string;
  suggestion?: string;
  
  // Command intercept specific
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
}

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

export interface SkillMetadata {
  name: string;
  version: string;
  type: 'guardrail';
  description: string;
  guardrails: {
    rules: GuardrailRule[];
    hooks: string[];
    config: {
      schema: string;
      defaults: string;
    };
  };
  engines: {
    guardrails: string;
  };
}

export interface GuardrailRule {
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
