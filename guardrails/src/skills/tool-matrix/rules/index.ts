// Tool Matrix Guardrail Rules
// Enforces modern tool usage from 01-philosophy "Golden Rules"

import type { Rule, RuleDefinition, RuleContext, GuardrailResult } from '../../../core/types';

const toolMappings: Array<{ id: string; pattern: string; modern: string; message: string }> = [
  {
    id: 'tool-matrix-find-to-fd',
    pattern: '^find\\s+',
    modern: 'fd',
    message: "Consider using 'fd' instead of 'find' for better performance and usability",
  },
  {
    id: 'tool-matrix-grep-to-rg',
    pattern: '^grep\\s+',
    modern: 'rg',
    message: "Consider using 'rg' (ripgrep) instead of 'grep' for faster search",
  },
  {
    id: 'tool-matrix-cat-to-bat',
    pattern: '^cat\\s+',
    modern: 'bat',
    message: "Consider using 'bat' instead of 'cat' for syntax highlighting",
  },
  {
    id: 'tool-matrix-ls-to-exa',
    pattern: '^ls\\s+',
    modern: 'eza',
    message: "Consider using 'eza' instead of 'ls' for better output",
  },
];

class ToolMatrixRule implements Rule {
  constructor(private mapping: typeof toolMappings[0]) {}

  get definition(): RuleDefinition {
    return {
      id: this.mapping.id,
      type: 'command_intercept',
      pattern: this.mapping.pattern,
      severity: 'info',
      message: this.mapping.message,
      suggestion: `${this.mapping.modern} {{args}}`,
      require_explicit: false,
    };
  }

  async check(context: RuleContext): Promise<GuardrailResult | null> {
    if (!context.command) return null;

    const pattern = new RegExp(this.mapping.pattern, 'i');
    if (!pattern.test(context.command)) {
      return null;
    }

    // Don't suggest if the modern tool is already being used
    if (context.command.includes(this.mapping.modern)) {
      return null;
    }

    return {
      action: 'ALLOW',
      ruleId: this.definition.id,
      message: this.definition.message,
      suggestion: this.definition.suggestion?.replace('{{args}}', context.args?.join(' ') || ''),
      severity: 'info',
    };
  }
}

export default toolMappings.map(m => new ToolMatrixRule(m));
