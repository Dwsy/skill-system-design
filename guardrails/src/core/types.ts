// Guardrail Skill System - Core Types

export interface SkillMetadata {
  name: string;
  version: string;
  type: 'guardrail' | 'utility' | 'integration';
  description: string;
  author: string;
  entry: {
    rules?: string;
  };
  rules: RuleDefinition[];
  config?: {
    schema?: string;
    defaults?: string;
  };
}

export interface RuleDefinition {
  id: string;
  type: 'command_intercept' | 'file_check' | 'env_guard' | 'git_hook';
  pattern?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  whitelist?: string[];
  require_explicit?: boolean;
}

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
  requireExplicit?: string; // flag to bypass
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
