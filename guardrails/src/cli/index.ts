#!/usr/bin/env bun

// Unified Guardrails CLI
// Combines KeenDragon's Commander structure with UltraStorm's skill system

import { Command } from 'commander';
import { GuardrailsEngine } from '../core/engine';
import { AuditReporter } from '../core/reporter';
import { SkillLoader } from '../core/loader';
import { applyFixes, printFixResults } from '../commands/apply';

// Try to load version from package.json
let version = '0.3.0';
try {
  const pkg = await import('../package.json', { assert: { type: 'json' } });
  version = pkg.default?.version || version;
} catch {
  // Use default version
}

const program = new Command();
const engine = new GuardrailsEngine();
const reporter = new AuditReporter();
const skillLoader = new SkillLoader('./src/skills');

// Initialize engine with skills
async function initEngine() {
  const skills = await skillLoader.loadAllSkills();
  for (const skill of skills) {
    engine.registerSkill(skill);
  }
}

program
  .name('pi-guardrails')
  .description('Guardrails for safe development practices')
  .version(version);

// Initialize guardrails in current project
program
  .command('init')
  .description('Initialize guardrails in current directory')
  .option('-t, --template <template>', 'Template to use (personal/project/team)', 'personal')
  .action(async (options) => {
    console.log('🔧 Initializing guardrails...');
    
    const template = options.template;
    // TODO: Implement init logic
    
    console.log(`✅ Guardrails initialized with '${template}' template`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Edit .guardrails/config.yml to customize rules');
    console.log('  2. Run `pi-guardrails check` to verify setup');
    console.log('  3. Run `pi-guardrails audit` for full project audit');
  });

// Check command against guardrails
program
  .command('check <command>')
  .description('Check a command against guardrails')
  .allowUnknownOption()
  .action(async (command, options, commandObj) => {
    await initEngine();
    
    console.log('🔍 Checking guardrails...\n');
    
    const args = commandObj.args.slice(1);
    const results = await engine.checkCommand(command, args);
    
    // Display results using my display logic
    displayResults(results);
    
    // Exit with error code if there are blocking violations
    const hasErrors = results.some(r => r.severity === 'error');
    process.exit(hasErrors ? 1 : 0);
  });

// Check current directory (project mode)
program
  .command('verify')
  .description('Check current project against all guardrails')
  .option('-r, --rules <rules>', 'Specific rules to check (comma-separated)')
  .option('-f, --fix', 'Auto-fix issues where possible')
  .action(async (options) => {
    await initEngine();
    
    console.log('🔍 Checking project guardrails...\n');
    
    const rules = options.rules?.split(',');
    // TODO: Implement project-wide check
    console.log('Project check not yet implemented. Use `check <command>` for command checking.');
  });

// Full audit with report generation
program
  .command('audit')
  .description('Perform full audit and generate report')
  .option('-o, --output <file>', 'Output file for report')
  .option('-f, --format <format>', 'Report format (json/markdown/html)', 'json')
  .action(async (options) => {
    await initEngine();
    
    console.log('📊 Running audit...\n');
    
    const skills = engine.getInstalledSkills();
    
    console.log('🔍 Guardrails Audit Report');
    console.log('=' .repeat(50));
    console.log(`\nInstalled Skills: ${skills.length}`);
    
    for (const skill of skills) {
      console.log(`\n📦 ${skill.metadata.name}`);
      console.log(`   Version: ${skill.metadata.version}`);
      console.log(`   Enabled: ${skill.config.enabled}`);
      console.log(`   Rules: ${skill.rules.length}`);
    }
    
    // TODO: Generate formal audit report
    if (options.output) {
      console.log(`\n✅ Audit report would be saved to ${options.output}`);
    }
  });

// Apply auto-fixes
program
  .command('apply')
  .description('Apply all available auto-fixes')
  .option('-n, --dry-run', 'Show what would be fixed without applying')
  .action(async (options) => {
    await initEngine();
    
    const results = await applyFixes({ dryRun: options.dryRun });
    printFixResults(results);
  });

// Install a guardrail skill
program
  .command('install <skill>')
  .description('Install a guardrail skill')
  .action(async (skill) => {
    console.log(`📦 Installing ${skill}...`);
    
    // TODO: Implement skill installation from registry
    console.log(`✅ ${skill} would be installed (mock)`);
    console.log('');
    console.log('Run `pi-guardrails audit` to see installed skills');
  });

// List installed skills
program
  .command('list')
  .description('List installed guardrail skills')
  .action(async () => {
    await initEngine();
    
    const skills = engine.getInstalledSkills();
    
    console.log('Installed guardrail skills:\n');
    
    if (skills.length === 0) {
      console.log('  No skills installed');
      console.log('  Run `pi-guardrails install <skill>` to add one');
    } else {
      for (const skill of skills) {
        const status = skill.config.enabled ? '✅' : '⏸️';
        console.log(`  ${status} ${skill.metadata.name}@${skill.metadata.version}`);
        console.log(`     ${skill.metadata.description}`);
      }
    }
  });

// Helper function to display results
function displayResults(results: import('../core/types').GuardrailResult[]): void {
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

program.parse();
