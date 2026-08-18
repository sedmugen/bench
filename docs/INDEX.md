# Bench Engineering Handbook

> Welcome to the official Bench Engineering and Documentation Handbook.
>
> **Documentation is the source of truth. Code exists to faithfully implement the documentation.**

---

# Reading Order

If you are new to Bench or onboarding as a developer or reviewer, read these documents in order:

1. [README.md](../README.md) — Project vision, philosophy, and showcase
2. [principles.md](./principles.md) — Core product and engineering constitution
3. [terminology.md](./terminology.md) — Canonical domain vocabulary
4. [prd.md](./prd.md) — Product Requirements Document
5. [usage.md](./usage.md) — End-user workflows and keyboard cheatsheet
6. [data-model.md](./data-model.md) — Entity schemas, relationships, and invariants
7. [architecture.md](./architecture.md) — Layered architecture and system boundaries
8. [api.md](./api.md) — Core domain and persistence API reference
9. [ui-guidelines.md](./ui-guidelines.md) — UI/UX design tokens and layout specs
10. [code-style.md](./code-style.md) — Code hygiene, naming, and engineering rules
11. [decisions/](./decisions/) — Architecture Decision Records (ADRs 0001–0008)
12. [BUILD.md](../BUILD.md) — Development environment setup and compilation
13. [CONTRIBUTING.md](../CONTRIBUTING.md) — Contribution workflows and pull request guide
14. [AGENTS.md](../AGENTS.md) — AI engineering constitution

---

# Documentation Structure

The documentation is organized into three distinct operational layers:

## 1. Product Layer
Defines **what** Bench is and why it exists.

| Document | Purpose |
|---|---|
| [README.md](../README.md) | Project overview, showcase visuals, and manifesto |
| [principles.md](./principles.md) | Core product philosophy and constraint boundaries |
| [prd.md](./prd.md) | Product Requirements Document for current capabilities |
| [usage.md](./usage.md) | Practical end-user workflows and cheatsheet |
| [ROADMAP.md](../ROADMAP.md) | Strategic product milestones from v0.1 to v1.0 |

---

## 2. Engineering Layer
Defines **how** Bench is built and structured internally.

| Document | Purpose |
|---|---|
| [terminology.md](./terminology.md) | Canonical vocabulary and preferred terminology |
| [data-model.md](./data-model.md) | Domain entity schemas, lifecycles, and constraints |
| [architecture.md](./architecture.md) | Layered architecture, domain isolation, and event flows |
| [api.md](./api.md) | Core domain stores, EventBus, and infrastructure APIs |
| [ui-guidelines.md](./ui-guidelines.md) | UI layout specifications, typography, and theme tokens |
| [code-style.md](./code-style.md) | Coding conventions, imports, and hygiene standards |
| [decisions/](./decisions/) | Architecture Decision Records (ADRs 0001–0008) |
| [BUILD.md](../BUILD.md) | Local environment setup, test runner, and packaging |
| [AGENTS.md](../AGENTS.md) | AI engineering constitution and strict guardrails |

---

## 3. Community Layer
Defines **how** contributors collaborate.

| Document | Purpose |
|---|---|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution lifecycle and PR expectations |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Contributor Covenant community standards |
| [SECURITY.md](../SECURITY.md) | Security vulnerability disclosure policy |
| [CHANGELOG.md](../CHANGELOG.md) | Release history following Keep a Changelog |
| [LICENSE](../LICENSE) | MIT License |

---

# Architecture Decision Records (ADRs)

Significant architectural and product decisions are preserved in [`docs/decisions/`](./decisions/):

- **ADR 0001:** [Documentation Is the Source of Truth](./decisions/0001-documentation-is-the-source-of-truth.md)
- **ADR 0002:** [Focus Is Derived State](./decisions/0002-focus-is-derived-state.md)
- **ADR 0003:** [Projects Are First-Class Citizens](./decisions/0003-projects-are-first-class-citizens.md)
- **ADR 0004:** [Local First](./decisions/0004-local-first.md)
- **ADR 0005:** [Areas Hierarchy and Workspace Inspector](./decisions/0005-areas-hierarchy-and-workspace-inspector.md)
- **ADR 0006:** [Scratchpad and Visual Clips Storage Models](./decisions/0006-scratchpad-and-visual-clips-storage-models.md)
- **ADR 0007:** [Cross-Platform Web and Desktop Dual Runtime](./decisions/0007-cross-platform-web-and-desktop-runtime.md)
- **ADR 0008:** [Custom Symbol System and Visual Theme Engine](./decisions/0008-custom-symbol-system-and-visual-themes.md)

---

# Guiding Workflow

Bench follows **Documentation-Driven Development (DDD)**:

```
Idea → Discussion → Decision → Documentation → Implementation → Review → Release
```

> *Documentation is not an afterthought — it is the foundation upon which Bench is built.*
