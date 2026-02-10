import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import type { 
  GuardrailsConfig, 
  CheckOptions, 
  CheckResults, 
  AuditReport,
  RuleDefinition,
  Violation 
} from './types';

export class GuardrailsEngine {
  private configPath = '.guardrails/config.yml';
  private rulesDir = '.guardrails/rules';
  
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
    
    // Get active rules
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
  
  async applyFixes(options: { dryRun?: boolean } = {}): Promise<FixResults> {
    const results = await this.check();
    const applied: string[] = [];
    const failed: string[] = [];
    
    for (const violation of results.violations) {
      if (violation.fixable) {
        try {
          if (!options.dryRun) {
            await this.applyFix(violation);
          }
          applied.push(violation.rule);
        } catch (error) {
          failed.push(violation.rule);
        }
      }
    }
    
    return {
      applied,
      failed,
      dryRun: options.dryRun || false
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
  
  private loadConfig(): GuardrailsConfig {
    if (!existsSync(this.configPath)) {
      return { version: '1.0.0', rules: [] };
    }
    
    const content = readFileSync(this.configPath, 'utf-8');
    return parseYaml(content) as GuardrailsConfig;
  }
  
  private loadTemplate(template: string): string {
    const templates: Record<string, string> = {
      personal: `# Personal development guardrails
version: "1.0.0"

rules:
  - id: safe-rm
    type: command_intercept
    target: rm
    action: redirect
    to: trash
    severity: error
    enabled: true
    message: "Use 'trash' instead of 'rm' to prevent accidental deletion"
    
  - id: prefer-fd-over-find
    type: tool_check
    target: find
    alternatives: [fd]
    severity: warning
    enabled: true
    message: "Consider using 'fd' instead of 'find' for better UX"
    
  - id: prefer-rg-over-grep
    type: tool_check
    target: grep
    alternatives: [rg]
    severity: warning
    enabled: true
    message: "Consider using 'rg' (ripgrep) instead of 'grep' for better performance"
`,
      project: `# Team project guardrails
version: "1.0.0"

rules:
  - id: safe-rm
    type: command_intercept
    target: rm
    action: confirm
    severity: error
    enabled: true
    message: "Confirm before deleting files in project directory"
    
  - id: safe-git-restore
    type: command_intercept
    target: git restore
    action: confirm
    severity: warning
    enabled: true
    message: "Confirm before restoring files (may lose uncommitted changes)"
    
  - id: require-tmux-for-long-commands
    type: command_intercept
    target: "*"
    condition: "duration > 60s"
    action: suggest
    to: "Run in tmux to prevent interruption"
    severity: warning
    enabled: true
`,
      team: `# Enterprise team guardrails
version: "1.0.0"

rules:
  - id: block-dangerous-rm
    type: command_intercept
    target: rm
    action: block
    severity: error
    enabled: true
    message: "Use 'trash' or explicit deletion workflow"
    
  - id: require-code-review
    type: file_check
    path: .git/COMMIT_EDITMSG
    condition: "exists"
    action: validate
    severity: error
    enabled: true
    message: "All commits must have descriptive messages"
    
  - id: security-scan
    type: pre_commit
    command: "npm audit"
    severity: error
    enabled: true
    message: "Security vulnerabilities must be resolved before commit"
`
    };
    
    return templates[template] || templates.personal;
  }
  
  private async createDefaultRules(): Promise<void> {
    // Create any default rule files
  }
  
  private async checkRule(rule: RuleDefinition): Promise<RuleCheckResult> {
    switch (rule.type) {
      case 'command_intercept':
        return this.checkCommandIntercept(rule);
      case 'tool_check':
        return this.checkTool(rule);
      case 'file_check':
        return this.checkFile(rule);
      default:
        return { passed: true };
    }
  }
  
  private checkCommandIntercept(rule: RuleDefinition): RuleCheckResult {
    // Check if command is in shell history or alias
    // This is a simplified check - real implementation would use shell hooks
    return { passed: true }; // Placeholder
  }
  
  private checkTool(rule: RuleDefinition): RuleCheckResult {
    // Check if preferred tool is available
    const hasPreferred = rule.alternatives?.some(alt => this.commandExists(alt));
    
    return {
      passed: hasPreferred || false,
      message: hasPreferred ? undefined : rule.message,
      suggestion: `Install ${rule.alternatives?.join(' or ')} for better experience`
    };
  }
  
  private checkFile(rule: RuleDefinition): RuleCheckResult {
    // Check file conditions
    return { passed: true }; // Placeholder
  }
  
  private commandExists(cmd: string): boolean {
    // Check if command exists in PATH
    try {
      Bun.spawn(['which', cmd], { stdout: 'ignore' });
      return true;
    } catch {
      return false;
    }
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
        // Create alias from rm to trash
        console.log('Creating alias: rm → trash');
        break;
      default:
        console.log(`No auto-fix available for ${violation.rule}`);
    }
  }
}

// Types
interface RuleCheckResult {
  passed: boolean;
  message?: string;
  suggestion?: string;
  fixable?: boolean;
}

interface FixResults {
  applied: string[];
  failed: string[];
  dryRun: boolean;
}
