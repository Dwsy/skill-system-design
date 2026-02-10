// Command Intercept Rule Implementation

import type { Rule, RuleDefinition, RuleContext, GuardrailResult } from '../types';

export class CommandInterceptRule implements Rule {
  constructor(public definition: RuleDefinition) {}

  async check(context: RuleContext): Promise<GuardrailResult | null> {
    if (!context.command) return null;

    const pattern = new RegExp(this.definition.pattern || '', 'i');
    
    if (!pattern.test(context.command)) {
      return null;
    }

    // Check whitelist
    if (this.definition.whitelist) {
      const isWhitelisted = this.definition.whitelist.some(path => 
        context.command?.includes(path) || context.args?.some(arg => arg.includes(path))
      );
      if (isWhitelisted) return null;
    }

    return {
      action: this.mapSeverityToAction(this.definition.severity),
      ruleId: this.definition.id,
      message: this.definition.message,
      suggestion: this.definition.suggestion,
      severity: this.definition.severity,
      requireExplicit: this.definition.require_explicit ? `--force-${this.definition.id}` : undefined,
    };
  }

  private mapSeverityToAction(severity: string): 'ALLOW' | 'BLOCK' | 'WARN' {
    switch (severity) {
      case 'error': return 'BLOCK';
      case 'warning': return 'WARN';
      case 'info': return 'ALLOW';
      default: return 'WARN';
    }
  }
}
