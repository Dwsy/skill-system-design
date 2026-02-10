import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { homedir } from 'os';

export type ShellType = 'bash' | 'zsh' | 'fish';

export interface ShellAdapter {
  type: ShellType;
  configPath: string;
  aliasSyntax: (name: string, command: string) => string;
  commentSyntax: (text: string) => string;
}

export const shellAdapters: Record<ShellType, ShellAdapter> = {
  bash: {
    type: 'bash',
    configPath: resolve(homedir(), '.bashrc'),
    aliasSyntax: (name, command) => `alias ${name}='${command}'`,
    commentSyntax: (text) => `# ${text}`
  },
  zsh: {
    type: 'zsh',
    configPath: resolve(homedir(), '.zshrc'),
    aliasSyntax: (name, command) => `alias ${name}='${command}'`,
    commentSyntax: (text) => `# ${text}`
  },
  fish: {
    type: 'fish',
    configPath: resolve(homedir(), '.config', 'fish', 'config.fish'),
    aliasSyntax: (name, command) => `abbr ${name} ${command}`,
    commentSyntax: (text) => `# ${text}`
  }
};

export function detectShell(): ShellType {
  const shell = process.env.SHELL || '';
  
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('fish')) return 'fish';
  
  // 默认返回 bash
  return 'bash';
}

export function getShellAdapter(shell?: ShellType): ShellAdapter {
  const detected = shell || detectShell();
  return shellAdapters[detected];
}

export function generateConfigSection(
  adapter: ShellAdapter,
  ruleId: string,
  version: string,
  aliases: Record<string, string>
): string {
  const lines: string[] = [
    '',
    adapter.commentSyntax(`=== Guardrails: ${ruleId} [v${version}] ===`),
    adapter.commentSyntax('自动生成的配置，请勿手动修改'),
    adapter.commentSyntax(`更新时间: ${new Date().toISOString()}`),
    ''
  ];

  for (const [name, command] of Object.entries(aliases)) {
    lines.push(adapter.aliasSyntax(name, command));
  }

  lines.push('');
  lines.push(adapter.commentSyntax('===================================='));
  lines.push('');

  return lines.join('\n');
}

export function createBackup(configPath: string): string {
  const backupDir = resolve(homedir(), '.guardrails', 'backups');
  mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${dirname(configPath).replace(/\//g, '_')}_${timestamp}.backup`;
  const backupPath = resolve(backupDir, backupName);

  const content = readFileSafe(configPath) || '';
  writeFileSync(backupPath, content, 'utf-8');

  // 清理旧备份，只保留最近 5 个
  cleanupOldBackups(backupDir, 5);

  return backupPath;
}

function cleanupOldBackups(backupDir: string, keepCount: number): void {
  try {
    const { readdirSync, statSync, unlinkSync } = require('fs');
    const files = readdirSync(backupDir)
      .map(f => ({ name: f, path: resolve(backupDir, f), stat: statSync(resolve(backupDir, f)) }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

    for (let i = keepCount; i < files.length; i++) {
      unlinkSync(files[i].path);
    }
  } catch {
    // 忽略清理错误
  }
}

export function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

export function checkCommandExists(cmd: string): boolean {
  try {
    const { execSync } = require('child_process');
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function hasGuardrailsConfig(configPath: string, ruleId: string): boolean {
  const content = readFileSafe(configPath) || '';
  return content.includes(`Guardrails: ${ruleId}`);
}

export function updateGuardrailsSection(
  configPath: string,
  ruleId: string,
  newSection: string
): void {
  const content = readFileSafe(configPath) || '';
  
  // 查找现有的 guardrails 配置段
  const startMarker = new RegExp(`# === Guardrails: ${ruleId} \\[v[^\\]]+\\] ===`);
  const endMarker = /# =+$/m;
  
  let newContent: string;
  
  if (startMarker.test(content)) {
    // 替换现有配置段
    const lines = content.split('\n');
    const result: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      if (startMarker.test(line)) {
        inSection = true;
        continue;
      }
      if (inSection && endMarker.test(line)) {
        inSection = false;
        continue;
      }
      if (!inSection) {
        result.push(line);
      }
    }
    
    newContent = result.join('\n') + newSection;
  } else {
    // 追加新配置段
    newContent = content + newSection;
  }
  
  writeFileSync(configPath, newContent, 'utf-8');
}
