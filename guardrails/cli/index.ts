#!/usr/bin/env bun

import { Command } from 'commander';
import { GuardrailsEngine } from '../core/engine';
import { AuditReporter } from '../core/reporter';
import { SkillLoader } from '../core/skill-loader';
import { version } from '../package.json';

const program = new Command();
const engine = new GuardrailsEngine();
const reporter = new AuditReporter();
const skillLoader = new SkillLoader();

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
    await engine.init({ template });
    
    console.log(`✅ Guardrails initialized with '${template}' template`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Edit .guardrails/config.yml to customize rules');
    console.log('  2. Run `pi-guardrails check` to verify setup');
    console.log('  3. Run `pi-guardrails audit` for full project audit');
  });

// Check current directory against guardrails
program
  .command('check')
  .description('Check current directory against guardrails')
  .option('-r, --rules <rules>', 'Specific rules to check (comma-separated)')
  .option('-f, --fix', 'Auto-fix issues where possible')
  .action(async (options) => {
    console.log('🔍 Checking guardrails...\n');
    
    const rules = options.rules?.split(',');
    const results = await engine.check({ rules, fix: options.fix });
    
    reporter.printCheckResults(results);
    
    const exitCode = results.violations.filter(v => v.severity === 'error').length;
    process.exit(exitCode > 0 ? 1 : 0);
  });

// Full audit with report generation
program
  .command('audit')
  .description('Perform full project audit and generate report')
  .option('-o, --output <file>', 'Output file for report', 'guardrails-report.json')
  .option('-f, --format <format>', 'Report format (json/markdown/html)', 'json')
  .action(async (options) => {
    console.log('📊 Running full audit...\n');
    
    const report = await engine.audit();
    
    await reporter.saveReport(report, {
      file: options.output,
      format: options.format
    });
    
    console.log(`✅ Audit report saved to ${options.output}`);
    console.log('');
    console.log('Summary:');
    console.log(`  Rules checked: ${report.summary.totalRules}`);
    console.log(`  Violations: ${report.summary.violations}`);
    console.log(`  Warnings: ${report.summary.warnings}`);
    console.log(`  Passed: ${report.summary.passed}`);
  });

// Apply auto-fixes
program
  .command('apply')
  .description('Apply all available auto-fixes')
  .option('-n, --dry-run', 'Show what would be fixed without applying')
  .action(async (options) => {
    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made\n');
    } else {
      console.log('🔧 Applying fixes...\n');
    }
    
    const results = await engine.applyFixes({ dryRun: options.dryRun });
    
    reporter.printFixResults(results);
  });

// Install a guardrail skill
program
  .command('install <skill>')
  .description('Install a guardrail skill')
  .action(async (skill) => {
    console.log(`📦 Installing ${skill}...`);
    
    await skillLoader.install(skill);
    
    console.log(`✅ ${skill} installed`);
    console.log('');
    console.log('Run `pi-guardrails check` to activate the new rules');
  });

// List installed skills
program
  .command('list')
  .description('List installed guardrail skills')
  .action(async () => {
    const skills = await skillLoader.list();
    
    console.log('Installed guardrail skills:\n');
    
    if (skills.length === 0) {
      console.log('  No skills installed');
      console.log('  Run `pi-guardrails install <skill>` to add one');
    } else {
      for (const skill of skills) {
        const status = skill.enabled ? '✅' : '⏸️';
        console.log(`  ${status} ${skill.name}@${skill.version}`);
        console.log(`     ${skill.description}`);
      }
    }
  });

// Add a custom rule
program
  .command('add-rule <name>')
  .description('Add a custom rule to current project')
  .option('-t, --type <type>', 'Rule type (command/file/env/tool)', 'command')
  .action(async (name, options) => {
    console.log(`➕ Adding rule '${name}'...`);
    
    await engine.addRule({
      name,
      type: options.type
    });
    
    console.log(`✅ Rule '${name}' added`);
    console.log(`  Edit .guardrails/rules/${name}.yml to customize`);
  });

program.parse();
