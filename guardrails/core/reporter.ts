import { writeFileSync } from 'fs';
import type { CheckResults, AuditReport } from './types';

export class AuditReporter {
  printCheckResults(results: CheckResults): void {
    console.log('');
    console.log('═'.repeat(60));
    console.log('Guardrails Check Results');
    console.log('═'.repeat(60));
    console.log('');
    
    if (results.violations.length === 0 && results.warnings.length === 0) {
      console.log('✅ All checks passed!');
      console.log(`   ${results.checked} rules checked`);
      return;
    }
    
    // Print violations
    if (results.violations.length > 0) {
      console.log('❌ Violations (must fix):');
      console.log('');
      
      for (const v of results.violations) {
        console.log(`  [${v.rule}]`);
        console.log(`  ${v.message}`);
        if (v.suggestion) {
          console.log(`  💡 ${v.suggestion}`);
        }
        if (v.fixable) {
          console.log(`  🔧 Run with --fix to auto-resolve`);
        }
        console.log('');
      }
    }
    
    // Print warnings
    if (results.warnings.length > 0) {
      console.log('⚠️  Warnings (recommended):');
      console.log('');
      
      for (const w of results.warnings) {
        console.log(`  [${w.rule}]`);
        console.log(`  ${w.message}`);
        if (w.suggestion) {
          console.log(`  💡 ${w.suggestion}`);
        }
        console.log('');
      }
    }
    
    // Summary
    console.log('─'.repeat(60));
    console.log(`Summary: ${results.violations.length} violations, ${results.warnings.length} warnings, ${results.passed} passed`);
    console.log('─'.repeat(60));
  }
  
  async saveReport(
    report: AuditReport,
    options: { file: string; format: 'json' | 'markdown' | 'html' }
  ): Promise<void> {
    let content: string;
    
    switch (options.format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'markdown':
        content = this.toMarkdown(report);
        break;
      case 'html':
        content = this.toHtml(report);
        break;
      default:
        content = JSON.stringify(report, null, 2);
    }
    
    writeFileSync(options.file, content);
  }
  
  printFixResults(results: { applied: string[]; failed: string[]; dryRun: boolean }): void {
    console.log('');
    
    if (results.dryRun) {
      console.log('🔍 Dry run - no changes made');
      console.log('');
    }
    
    if (results.applied.length > 0) {
      console.log('✅ Applied fixes:');
      for (const fix of results.applied) {
        console.log(`   - ${fix}`);
      }
      console.log('');
    }
    
    if (results.failed.length > 0) {
      console.log('❌ Failed to apply:');
      for (const fix of results.failed) {
        console.log(`   - ${fix}`);
      }
      console.log('');
    }
    
    if (results.applied.length === 0 && results.failed.length === 0) {
      console.log('ℹ️  No fixes available');
    }
  }
  
  private toMarkdown(report: AuditReport): string {
    return `# Guardrails Audit Report

**Generated:** ${report.metadata.timestamp}
**Project Type:** ${report.metadata.project}
**Guardrails Version:** ${report.metadata.guardrailsVersion}

## Summary

| Metric | Count |
|--------|-------|
| Total Rules | ${report.summary.totalRules} |
| Violations | ${report.summary.violations} |
| Warnings | ${report.summary.warnings} |
| Passed | ${report.summary.passed} |

## Violations

${report.violations.map(v => `- **${v.rule}** (${v.severity}): ${v.message}`).join('\n') || 'None'}

## Warnings

${report.warnings.map(w => `- **${w.rule}** (${w.severity}): ${w.message}`).join('\n') || 'None'}

## Recommendations

${report.recommendations.map(r => `- ${r}`).join('\n') || 'None'}
`;
  }
  
  private toHtml(report: AuditReport): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Guardrails Audit Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #333; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .metric { padding: 20px; border-radius: 8px; text-align: center; }
    .metric.violations { background: #fee; color: #c00; }
    .metric.warnings { background: #ffeaa7; color: #b7791f; }
    .metric.passed { background: #d4edda; color: #155724; }
    .metric.total { background: #f8f9fa; }
    ul { line-height: 1.8; }
  </style>
</head>
<body>
  <h1>Guardrails Audit Report</h1>
  <p>Generated: ${report.metadata.timestamp}</p>
  <p>Project: ${report.metadata.project}</p>
  
  <div class="summary">
    <div class="metric total">
      <div>Total Rules</div>
      <div style="font-size: 2em; font-weight: bold;">${report.summary.totalRules}</div>
    </div>
    <div class="metric violations">
      <div>Violations</div>
      <div style="font-size: 2em; font-weight: bold;">${report.summary.violations}</div>
    </div>
    <div class="metric warnings">
      <div>Warnings</div>
      <div style="font-size: 2em; font-weight: bold;">${report.summary.warnings}</div>
    </div>
    <div class="metric passed">
      <div>Passed</div>
      <div style="font-size: 2em; font-weight: bold;">${report.summary.passed}</div>
    </div>
  </div>
  
  <h2>Violations</h2>
  <ul>
    ${report.violations.map(v => `<li><strong>${v.rule}</strong>: ${v.message}</li>`).join('') || '<li>None</li>'}
  </ul>
  
  <h2>Warnings</h2>
  <ul>
    ${report.warnings.map(w => `<li><strong>${w.rule}</strong>: ${w.message}</li>`).join('') || '<li>None</li>'}
  </ul>
</body>
</html>`;
  }
}
