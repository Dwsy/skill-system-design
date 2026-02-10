// Skill Loader - Load skills from filesystem

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { SkillMetadata, InstalledSkill, SkillConfig, Rule } from './types';

export class SkillLoader {
  private skillsDir: string;

  constructor(skillsDir: string = './src/skills') {
    this.skillsDir = skillsDir;
  }

  async loadSkill(name: string): Promise<InstalledSkill | null> {
    const skillPath = join(this.skillsDir, name);
    
    if (!existsSync(skillPath)) {
      console.error(`Skill not found: ${name}`);
      return null;
    }

    // Load metadata
    const metadataPath = join(skillPath, 'metadata.json');
    if (!existsSync(metadataPath)) {
      console.error(`Metadata not found for skill: ${name}`);
      return null;
    }

    const metadata: SkillMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

    // Load config
    const config = await this.loadConfig(skillPath, metadata);

    // Load rules
    const rules = await this.loadRules(skillPath, metadata);

    return {
      metadata,
      config,
      rules,
    };
  }

  async loadAllSkills(): Promise<InstalledSkill[]> {
    // For now, hardcode the built-in skills
    const builtinSkills = ['safe-rm', 'safe-git', 'tool-matrix'];
    const skills: InstalledSkill[] = [];

    for (const name of builtinSkills) {
      const skill = await this.loadSkill(name);
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private async loadConfig(skillPath: string, metadata: SkillMetadata): Promise<SkillConfig> {
    const defaultsPath = metadata.config?.defaults 
      ? join(skillPath, metadata.config.defaults) 
      : null;

    const defaults: SkillConfig = {
      enabled: true,
      severity: 'warning',
    };

    // TODO: Load user overrides from ~/.pi/config/

    return defaults;
  }

  private async loadRules(skillPath: string, metadata: SkillMetadata): Promise<Rule[]> {
    // First try to use static rules from metadata
    if (metadata.rules && metadata.rules.length > 0) {
      // Convert RuleDefinition to Rule objects
      return metadata.rules.map(def => ({
        definition: def,
        check: async (context: any) => {
          // Simple check implementation based on rule type
          if (def.type === 'command_intercept' && context.command) {
            const pattern = new RegExp(def.pattern || def.target || '');
            if (pattern.test(context.command)) {
              return {
                action: def.action === 'block' ? 'BLOCK' : 'WARN' as const,
                ruleId: def.id,
                message: def.message,
                suggestion: def.suggestion,
                severity: def.severity,
                fixable: def.action === 'redirect' || def.action === 'suggest'
              };
            }
          }
          return null;
        }
      }));
    }

    // Fallback to dynamic import if entry.rules is specified
    if (!metadata.entry?.rules) {
      return [];
    }

    const rulesPath = join(skillPath, metadata.entry.rules);
    
    try {
      // Dynamic import for TypeScript modules
      const rulesModule = await import(rulesPath);
      return rulesModule.default || [];
    } catch (error) {
      console.error(`Failed to load rules from ${rulesPath}:`, error);
      return [];
    }
  }
}
