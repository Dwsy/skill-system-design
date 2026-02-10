// Guardrail Rule Engine

import type { Rule, RuleContext, GuardrailResult, InstalledSkill } from './types';

export class GuardrailEngine {
  private skills: InstalledSkill[] = [];

  registerSkill(skill: InstalledSkill): void {
    this.skills.push(skill);
  }

  async check(context: RuleContext): Promise<GuardrailResult[]> {
    const results: GuardrailResult[] = [];

    for (const skill of this.skills) {
      if (!skill.config.enabled) continue;

      for (const rule of skill.rules) {
        const result = await rule.check(context);
        if (result) {
          results.push(result);
        }
      }
    }

    // Sort by severity: error > warning > info
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  async checkCommand(command: string, args: string[] = []): Promise<GuardrailResult[]> {
    return this.check({
      command,
      args,
      env: process.env as Record<string, string>,
      cwd: process.cwd(),
    });
  }

  getInstalledSkills(): InstalledSkill[] {
    return this.skills;
  }
}
