// Safe Git Guardrail Rules

import type { Rule, RuleDefinition, RuleContext, GuardrailResult } from '../../../core/types';

class SafeGitRestoreRule implements Rule {
  definition: RuleDefinition = {
    id: 'safe-git-restore-dot',
    type: 'command_intercept',
    pattern: '^git\\s+restore\\s+\\.$',
    severity: 'error',
    message: "'git restore .' will discard ALL changes, including files you didn't modify. This is dangerous in team environments.",
    suggestion: "git restore <specific-file>  or  git status --short | grep '^ M' | awk '{print $2}' | xargs git restore",
    require_explicit: true,
  };

  async check(context: RuleContext): Promise<GuardrailResult | null> {
    if (!context.command) return null;

    const pattern = /^git\s+restore\s+\.$/i;
    if (!pattern.test(context.command)) {
      return null;
    }

    return {
      action: 'BLOCK',
      ruleId: this.definition.id,
      message: this.definition.message,
      suggestion: this.definition.suggestion,
      severity: 'error',
      requireExplicit: '--i-know-what-im-doing',
    };
  }
}

class SafeGitForcePushRule implements Rule {
  definition: RuleDefinition = {
    id: 'safe-git-force-push',
    type: 'command_intercept',
    pattern: '^git\\s+push\\s+.*(--force|-f)',
    severity: 'warning',
    message: "Force push can overwrite others' work. Consider 'git push --force-with-lease' instead.",
    suggestion: 'git push --force-with-lease',
    require_explicit: false,
  };

  async check(context: RuleContext): Promise<GuardrailResult | null> {
    if (!context.command) return null;

    const pattern = /^git\s+push\s+.*(--force|-f)/i;
    if (!pattern.test(context.command)) {
      return null;
    }

    return {
      action: 'WARN',
      ruleId: this.definition.id,
      message: this.definition.message,
      suggestion: this.definition.suggestion,
      severity: 'warning',
      requireExplicit: '--force-push',
    };
  }
}

export default [new SafeGitRestoreRule(), new SafeGitForcePushRule()];
