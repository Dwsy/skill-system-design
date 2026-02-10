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
    if (!metadata.entry.rules) {
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
