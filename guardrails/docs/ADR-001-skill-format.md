# ADR-001: Guardrail Skill Format

## Status
Proposed

## Context
We need to define a standard format for guardrail skills that:
- Is compatible with 02-architecture.md's skill system design
- Supports rule-based guardrails (intercepts commands, checks conditions)
- Can be installed locally without a full registry
- Is simple enough for community contributions

## Decision

### Skill Package Structure

```
@builtin/safe-rm/
├── metadata.json          # Skill metadata
├── rules/
│   └── index.ts           # Rule implementations
├── config/
│   ├── default.yml        # Default configuration
│   └── schema.json        # Config validation schema
└── tests/
    └── index.test.ts      # Unit tests
```

### metadata.json Schema

```json
{
  "name": "@builtin/safe-rm",
  "version": "1.0.0",
  "type": "guardrail",
  "description": "Intercept rm commands and suggest trash",
  "author": "Skill System Team",
  
  "entry": {
    "rules": "rules/index.ts"
  },
  
  "rules": [
    {
      "id": "safe-rm-intercept",
      "type": "command_intercept",
      "pattern": "^rm\\s+-rf?",
      "severity": "warning",
      "message": "Detected rm command. Consider using 'trash' instead.",
      "suggestion": "trash {{args}}"
    }
  ],
  
  "config": {
    "schema": "config/schema.json",
    "defaults": "config/default.yml"
  }
}
```

### Rule Types

1. **command_intercept**: Intercepts shell commands
2. **file_check**: Validates file operations
3. **env_guard**: Checks environment variables
4. **git_hook**: Git operation guards

### Configuration Schema

```yaml
# config/default.yml
enabled: true
severity: warning  # error | warning | info
whitelist:
  - "/tmp"
  - "/var/tmp"
require_explicit: false
```

## Consequences

### Positive
- Simple, declarative format
- Easy to understand and contribute
- Compatible with future registry integration
- Local installation works without network

### Negative
- TypeScript compilation required
- Limited to Bun/Node runtime initially
- Rule expressiveness constrained by schema

## Alternatives Considered

### Alternative 1: Pure YAML Rules
- **Pros**: No compilation, language agnostic
- **Cons**: Limited expressiveness, hard to test
- **Decision**: Rejected - need Turing-complete rules

### Alternative 2: WASM-based Rules
- **Pros**: Language agnostic, sandboxed
- **Cons**: Overkill for MVP, complexity
- **Decision**: Rejected - future optimization

## Implementation Plan

Week 1:
- [ ] Implement metadata.json loader
- [ ] Implement rule engine
- [ ] Implement safe-rm skill

Week 2:
- [ ] Implement safe-git skill
- [ ] Implement tool-matrix skill
- [ ] Add tests

## References
- 02-architecture.md
- 07-guardrails.md
