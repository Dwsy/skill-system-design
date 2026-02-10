// Unified Guardrails Engine
// Combines KeenDragon's config-based rules with UltraStorm's skill system

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { 
  GuardrailsConfig,
  SkillConfig,
  CheckOptions, 
  CheckResults, 
  AuditReport,
  RuleDefinition,
  Violation,
  Rule,
  RuleContext,
  GuardrailResult,
  InstalledSkill,
  FixOptions,
  FixResults
} from './types';

export class GuardrailsEngine {
  private configPath = '.guardrails/config.yml';
  private rulesDir = '.guardrails/rules';
  private skills: InstalledSkill[] = [];
  
  // ==================== Skill System (from UltraStorm) ====================
  
  registerSkill(skill: InstalledSkill): void {
    this.skills.push(skill);
  }
  
  getInstalledSkills(): InstalledSkill[] {
    return this.skills;
  }
  
  async checkContext(context: RuleContext): Promise<GuardrailResult[]> {
    const results: GuardrailResult[] = [];

    for (const skill of this.skills) {
      if (!skill.config.enabled) continue;

      for (const rule of skill.rules) {
        try {
          const result = await rule.check(context);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.warn(`Warning: Rule ${rule.definition.id} failed:`, error);
        }
      }
    }

    // Sort by severity: error > warning > info
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }
  
  async checkCommand(command: string, args: string[] = []): Promise<GuardrailResult[]> {
    return this.checkContext({
      command,
      args,
      env: process.env as Record<string, string>,
      cwd: process.cwd(),
    });
  }
  
  // ==================== Config System (from KeenDragon) ====================
  
  async init(options: { template: string }): Promise<void> {
    // Create guardrails directory structure
    if (!existsSync('.guardrails')) {
      mkdirSync('.guardrails', { recursive: true });
      mkdirSync('.guardrails/rules', { recursive: true });
    }
    
    // Copy template config
    const template = this.loadTemplate(options.template);
    writeFileSync(this.configPath, template);
    
    // Create default rules
    await this.createDefaultRules();
  }
  
  async check(options: CheckOptions = {}): Promise<CheckResults> {
    const config = this.loadConfig();
    const violations: Violation[] = [];
    const warnings: Violation[] = [];
    
    // Get active rules from config
    const rules = options.rules 
      ? config.rules.filter(r => options.rules!.includes(r.id))
      : config.rules.filter(r => r.enabled);
    
    // Check each rule
    for (const rule of rules) {
      try {
        const result = await this.checkRule(rule);
        
        if (!result.passed) {
          const violation: Violation = {
            rule: rule.id,
            type: rule.type,
            severity: rule.severity,
            message: result.message || rule.message,
            suggestion: result.suggestion || rule.suggestion,
            fixable: result.fixable || false
          };
          
          if (rule.severity === 'error') {
            violations.push(violation);
          } else {
            warnings.push(violation);
          }
        }
      } catch (error) {
        console.warn(`Warning: Failed to check rule ${rule.id}:`, error);
      }
    }
    
    return {
      violations,
      warnings,
      checked: rules.length,
      passed: rules.length - violations.length - warnings.length,
      timestamp: new Date().toISOString()
    };
  }
  
  async audit(): Promise<AuditReport> {
    // First check with config-based rules
    const results = await this.check();
    const config = this.loadConfig();
    
    // Gather additional metadata
    const metadata = {
      project: this.detectProjectType(),
      timestamp: new Date().toISOString(),
      guardrailsVersion: '0.3.0',
      configVersion: config.version || '1.0.0'
    };
    
    return {
      metadata,
      summary: {
        totalRules: results.checked,
        violations: results.violations.length,
        warnings: results.warnings.length,
        passed: results.passed
      },
      violations: results.violations,
      warnings: results.warnings,
      recommendations: this.generateRecommendations(results)
    };
  }
  
  async applyFixes(options: FixOptions = {}): Promise<FixResults> {
    const results = await this.check();
    const applied: number = 0;
    const failed: number = 0;
    const skipped: number = 0;
    
    for (const violation of results.violations) {
      if (violation.fixable) {
        try {
          if (!options.dryRun) {
            await this.applyFix(violation);
          }
          // applied.push(violation.rule);
        } catch (error) {
          // failed.push(violation.rule);
        }
      }
    }
    
    return {
      applied,
      failed,
      skipped,
      details: []
    };
  }
  
  async addRule(options: { name: string; type: string }): Promise<void> {
    const rulePath = join(this.rulesDir, `${options.name}.yml`);
    
    const template = `# ${options.name} rule
id: ${options.name}
type: ${options.type}
severity: warning
enabled: true
message: "Custom rule: ${options.name}"
# Add your rule configuration here
`;
    
    writeFileSync(rulePath, template);
  }
  
  // ==================== Private Helpers ====================
  
  private loadConfig(): GuardrailsConfig {
    if (!existsSync(this.configPath)) {
      return { version: '1.0.0', rules: [] };
    }
    
    // Simple YAML parsing without external dependency
    const content = readFileSync(this.configPath, 'utf-8');
    // For now, return empty config - proper YAML parsing can be added later
    return { version: '1.0.0', rules: [] };
  }
  
  private loadTemplate(template: string): string {
    const templates: Record<string, string> = {
      personal: `# Personal development guardrails
version: "1.0.0"

rules:
  - id: safe-rm
    type: command_intercept
    severity: error
    enabled: true
    message: "Use 'trash' instead of 'rm' to prevent accidental deletion"
    suggestion: "trash <files>"
    
  - id: prefer-fd-over-find
    type: tool_check
    severity: warning
    enabled: true
    message: "Consider using 'fd' instead of 'find' for better UX"
    alternatives: [fd]
`,
      project: `# Team project guardrails
version: "1.0.0"

rules:
  - id: safe-git-restore
    type: command_intercept
    severity: warning
    enabled: true
    message: "Confirm before restoring files (may lose uncommitted changes)"
    
  - id: prefer-rg-over-grep
    type: tool_check
    severity: warning
    enabled: true
    message: "Consider using 'rg' (ripgrep) instead of 'grep'"
    alternatives: [rg]
`,
      team: `# Enterprise team guardrails
version: "1.0.0"

rules:
  - id: block-dangerous-rm
    type: command_intercept
    severity: error
    enabled: true
    message: "Use 'trash' or explicit deletion workflow"
`
    };
    
    return templates[template] || templates.personal;
  }
  
  private async createDefaultRules(): Promise<void> {
    // Create any default rule files
  }
  
  private async checkRule(rule: RuleDefinition): Promise<RuleCheckResult> {
    // For now, always pass - real implementation would check against actual system
    return { passed: true };
  }
  
  private detectProjectType(): string {
    if (existsSync('package.json')) return 'node';
    if (existsSync('Cargo.toml')) return 'rust';
    if (existsSync('go.mod')) return 'go';
    if (existsSync('requirements.txt') || existsSync('pyproject.toml')) return 'python';
    return 'generic';
  }
  
  private generateRecommendations(results: CheckResults): string[] {
    const recommendations: string[] = [];
    
    if (results.violations.some(v => v.rule === 'safe-rm')) {
      recommendations.push('Install trash-cli: npm install -g trash-cli');
    }
    
    if (results.violations.some(v => v.rule.includes('tmux'))) {
      recommendations.push('Install tmux for background task management');
    }
    
    return recommendations;
  }
  
  private async applyFix(violation: Violation): Promise<void> {
    // Apply auto-fix based on violation type
    switch (violation.rule) {
      case 'safe-rm':
        console.log('Creating alias: rm → trash');
        break;
      default:
        console.log(`No auto-fix available for ${violation.rule}`);
    }
  }
}

// Helper types
interface RuleCheckResult {
  passed: boolean;
  message?: string;
  suggestion?: string;
  fixable?: boolean;
}
