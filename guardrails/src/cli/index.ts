// Guardrails CLI - pi guardrails

import { GuardrailEngine } from '../core/engine';
import { SkillLoader } from '../core/loader';
import type { GuardrailResult } from '../core/types';

class GuardrailsCLI {
  private engine: GuardrailEngine;
  private loader: SkillLoader;

  constructor() {
    this.engine = new GuardrailEngine();
    this.loader = new SkillLoader('./src/skills');
  }

  async init(): Promise<void> {
    const skills = await this.loader.loadAllSkills();
    for (const skill of skills) {
      this.engine.registerSkill(skill);
    }
  }

  async check(command: string, args: string[] = []): Promise<void> {
    const results = await this.engine.checkCommand(command, args);
    this.displayResults(results);
  }

  async audit(): Promise<void> {
    console.log('🔍 Guardrails Audit Report');
    console.log('=' .repeat(50));
    
    const skills = this.engine.getInstalledSkills();
    console.log(`\nInstalled Skills: ${skills.length}`);
    
    for (const skill of skills) {
      console.log(`\n📦 ${skill.metadata.name}`);
      console.log(`   Version: ${skill.metadata.version}`);
      console.log(`   Enabled: ${skill.config.enabled}`);
      console.log(`   Rules: ${skill.rules.length}`);
    }
  }

  private displayResults(results: GuardrailResult[]): void {
    if (results.length === 0) {
      console.log('✅ No guardrails triggered');
      return;
    }

    for (const result of results) {
      const icon = result.severity === 'error' ? '❌' : 
                   result.severity === 'warning' ? '⚠️' : 'ℹ️';
      
      console.log(`\n${icon} [${result.severity.toUpperCase()}] ${result.ruleId}`);
      console.log(`   ${result.message}`);
      
      if (result.suggestion) {
        console.log(`   💡 Suggestion: ${result.suggestion}`);
      }
      
      if (result.requireExplicit) {
        console.log(`   🚫 Use ${result.requireExplicit} to bypass`);
      }
    }
  }
}

// CLI entry point
async function main() {
  const cli = new GuardrailsCLI();
  await cli.init();

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage: pi guardrails <command>');
    console.log('');
    console.log('Commands:');
    console.log('  check <cmd> [args...]  Check a command against guardrails');
    console.log('  audit                  Show installed guardrails');
    console.log('');
    console.log('Examples:');
    console.log('  pi guardrails check "rm -rf ./test"');
    console.log('  pi guardrails check "git restore ."');
    console.log('  pi guardrails audit');
    return;
  }

  switch (command) {
    case 'check': {
      const cmdToCheck = args[1];
      if (!cmdToCheck) {
        console.error('Error: No command specified');
        process.exit(1);
      }
      const cmdArgs = args.slice(2);
      await cli.check(cmdToCheck, cmdArgs);
      break;
    }
    case 'audit':
      await cli.audit();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
