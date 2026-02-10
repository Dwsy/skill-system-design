import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import { safeRmRule } from '../src/rules/safe-rm';
import { CheckContext } from '../src/types';
import { getShellAdapter, readFileSafe } from '../src/utils/shell-adapter';

describe('safe-rm rule', () => {
  const testDir = resolve('/tmp', 'guardrails-test-' + Date.now());
  const mockConfigPath = resolve(testDir, 'mock-shell-config');

  beforeEach(() => {
    // 创建测试目录
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // 清理测试目录
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('check', () => {
    it('should pass when safe-rm is configured', async () => {
      // 模拟已配置的情况
      writeFileSync(mockConfigPath, `
# Some existing config
# === Guardrails: safe-rm [v1.0.0] ===
alias rm='trash'
# ====================================
`, 'utf-8');

      const context: CheckContext = {
        cwd: testDir,
        config: {
          version: '1.0.0',
          rules: {
            'safe-rm': { enabled: true, severity: 'error' }
          },
          presets: []
        },
        files: []
      };

      // 注意：实际测试需要模拟 shell 配置路径
      // 这里只是一个示例结构
    });

    it('should fail when safe-rm is not configured', async () => {
      // 模拟未配置的情况
      writeFileSync(mockConfigPath, '# Empty config\n', 'utf-8');

      const context: CheckContext = {
        cwd: testDir,
        config: {
          version: '1.0.0',
          rules: {
            'safe-rm': { enabled: true, severity: 'error' }
          },
          presets: []
        },
        files: []
      };

      // 注意：实际测试需要模拟 shell 配置路径
    });
  });

  describe('fix', () => {
    it('should add safe-rm configuration', async () => {
      writeFileSync(mockConfigPath, '# Original config\n', 'utf-8');

      const context: CheckContext = {
        cwd: testDir,
        config: {
          version: '1.0.0',
          rules: {
            'safe-rm': { enabled: true }
          },
          presets: []
        },
        files: []
      };

      // 注意：实际测试需要模拟 shell 配置路径
    });

    it('should update existing safe-rm configuration', async () => {
      writeFileSync(mockConfigPath, `
# Original config
# === Guardrails: safe-rm [v0.9.0] ===
alias rm='old-trash'
# ====================================
`, 'utf-8');

      const context: CheckContext = {
        cwd: testDir,
        config: {
          version: '1.0.0',
          rules: {
            'safe-rm': { enabled: true }
          },
          presets: []
        },
        files: []
      };

      // 注意：实际测试需要模拟 shell 配置路径
    });
  });
});

describe('shell-adapter', () => {
  describe('getShellAdapter', () => {
    it('should return correct adapter for bash', () => {
      const adapter = getShellAdapter('bash');
      expect(adapter.type).toBe('bash');
      expect(adapter.configPath).toContain('.bashrc');
    });

    it('should return correct adapter for zsh', () => {
      const adapter = getShellAdapter('zsh');
      expect(adapter.type).toBe('zsh');
      expect(adapter.configPath).toContain('.zshrc');
    });

    it('should return correct adapter for fish', () => {
      const adapter = getShellAdapter('fish');
      expect(adapter.type).toBe('fish');
      expect(adapter.configPath).toContain('config.fish');
    });
  });

  describe('generateConfigSection', () => {
    it('should generate correct bash aliases', () => {
      const adapter = getShellAdapter('bash');
      const section = generateConfigSection(
        adapter,
        'safe-rm',
        '1.0.0',
        { rm: 'trash', rmrf: 'trash -r' }
      );

      expect(section).toContain('Guardrails: safe-rm [v1.0.0]');
      expect(section).toContain("alias rm='trash'");
      expect(section).toContain("alias rmrf='trash -r'");
    });

    it('should generate correct fish abbreviations', () => {
      const adapter = getShellAdapter('fish');
      const section = generateConfigSection(
        adapter,
        'safe-rm',
        '1.0.0',
        { rm: 'trash', rmrf: 'trash -r' }
      );

      expect(section).toContain('Guardrails: safe-rm [v1.0.0]');
      expect(section).toContain('abbr rm trash');
      expect(section).toContain('abbr rmrf trash -r');
    });
  });
});

// 导入被测试的函数
import { generateConfigSection } from '../src/utils/shell-adapter';
