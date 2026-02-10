// Safe RM Guardrail Rules

import type { Rule, RuleDefinition, RuleContext, GuardrailResult } from '../../../core/types';

export class SafeRmRule implements Rule {
  definition: RuleDefinition = {
    id: 'safe-rm-intercept',
    type: 'command_intercept',
    pattern: '^rm\\s+-rf?',
    severity: 'warning',
    message: "Detected 'rm' command. Consider using 'trash' for safer deletion.",
    suggestion: 'trash {{args}}',
    whitelist: ['/tmp', '/var/tmp'],
    require_explicit: false,
  };

  async check(context: RuleContext): Promise<GuardrailResult | null> {
    if (!context.command) return null;

    const pattern = /^rm\s+-rf?/i;
    if (!pattern.test(context.command)) {
      return null;
    }

    // Check whitelist
    const isWhitelisted = this.definition.whitelist?.some(path =>
      context.command?.includes(path) || context.args?.some(arg => arg.includes(path))
    );
    if (isWhitelisted) return null;

    // Extract args for suggestion
    const args = context.args?.join(' ') || '';
    const suggestion = this.definition.suggestion?.replace('{{args}}', args);

    return {
      action: 'WARN',
      ruleId: this.definition.id,
      message: this.definition.message,
      suggestion,
      severity: 'warning',
      requireExplicit: this.definition.require_explicit ? '--force-rm' : undefined,
    };
  }
}

export default [new SafeRmRule()];
