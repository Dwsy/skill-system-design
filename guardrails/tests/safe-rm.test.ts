// Tests for safe-rm guardrail

import { describe, it, expect } from "bun:test";
import { SafeRmRule } from "../src/skills/safe-rm/rules/index";

describe("safe-rm guardrail", () => {
  const rule = new SafeRmRule();

  it("should detect 'rm -rf' command", async () => {
    const result = await rule.check({
      command: "rm -rf ./test",
      args: ["-rf", "./test"],
    });

    expect(result).not.toBeNull();
    expect(result?.ruleId).toBe("safe-rm-intercept");
    expect(result?.severity).toBe("warning");
    expect(result?.action).toBe("WARN");
  });

  it("should allow whitelisted paths", async () => {
    const result = await rule.check({
      command: "rm -rf /tmp/test",
      args: ["-rf", "/tmp/test"],
    });

    expect(result).toBeNull();
  });

  it("should not trigger for other commands", async () => {
    const result = await rule.check({
      command: "ls -la",
      args: ["-la"],
    });

    expect(result).toBeNull();
  });

  it("should include suggestion in result", async () => {
    const result = await rule.check({
      command: "rm -rf ./test",
      args: ["-rf", "./test"],
    });

    expect(result?.suggestion).toContain("trash");
  });
});
