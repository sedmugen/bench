\# Bench Documentation



> Welcome to the Bench Engineering Handbook.

>

> This directory contains the official documentation for Bench.

>

> Documentation is the source of truth.

> Code exists to implement the documentation.



\---



\# Reading Order



If you're new to Bench, read these documents in the following order.



1\. README.md

2\. principles.md

3\. terminology.md

4\. prd.md

5\. data-model.md

6\. architecture.md

7\. ui-guidelines.md

8\. code-style.md

9\. decisions/

10\. BUILD.md

11\. CONTRIBUTING.md

12\. AGENTS.md



Following this order will provide the complete context required to contribute effectively.



\---



\# Documentation Structure



The documentation is organized into three layers.



\## Product



Defines \*\*what\*\* Bench is.



| Document | Purpose |

|-----------|---------|

| README.md | Project overview and philosophy |

| principles.md | Product philosophy and engineering principles |

| prd.md | Product Requirements Document |

| ROADMAP.md | Product direction and milestones |



\---



\## Engineering



Defines \*\*how\*\* Bench is built.


---

## Engineering

Defines **how** Bench is built.

| Document | Purpose |
|-----------|---------|
| terminology.md | Shared vocabulary |
| data-model.md | Domain entities and relationships |
| architecture.md | Application architecture |
| api.md | Core domain and persistence API reference |
| ui-guidelines.md | User interface philosophy |
| code-style.md | Coding conventions |
| decisions/ | Architecture Decision Records (ADRs) |
| BUILD.md | Development environment setup |
| AGENTS.md | AI engineering constitution |



\## Community



Defines \*\*how\*\* contributors collaborate.



| Document | Purpose |

|-----------|---------|

| CONTRIBUTING.md | Contribution workflow |

| CODE\_OF\_CONDUCT.md | Community standards |

| CHANGELOG.md | Release history |

| LICENSE | Project license |



\---



\# Architecture Decision Records (ADRs)



Architectural decisions are stored in the `decisions/` directory.

Current ADRs:

- ADR 0001 — Documentation Is the Source of Truth
- ADR 0002 — Focus Is Derived State
- ADR 0003 — Projects Are First-Class Citizens
- ADR 0004 — Local First
- ADR 0005 — Areas Hierarchy and Workspace Inspector
- ADR 0006 — Scratchpad and Visual Clips Storage Models
- ADR 0007 — Cross-Platform Web and Desktop Dual Runtime
- ADR 0008 — Custom Symbol System and Visual Theme Engine

New ADRs should be numbered sequentially.


Existing ADRs should never be modified to change history.



\---



\# Guiding Philosophy



Bench follows Documentation-Driven Development.



```

Idea

&#x20;   ↓

Discussion

&#x20;   ↓

Decision

&#x20;   ↓

Documentation

&#x20;   ↓

Implementation

&#x20;   ↓

Review

&#x20;   ↓

Release

```



Documentation always precedes implementation.



\---



\# Repository Standards



Every contribution should:



\- Align with the Product Principles.

\- Respect the Domain Model.

\- Follow the Architecture.

\- Follow the Code Style Guide.

\- Preserve simplicity.

\- Reduce cognitive load.



If a contribution does not satisfy these expectations, it should be revised before merging.



\---



\# Need Help?



If you are unsure where to begin:



1\. Read the README.

2\. Follow the Reading Order.

3\. Review the relevant ADRs.

4\. Ask questions before making assumptions.



Bench values thoughtful questions over confident guesses.



\---



\# Final Principle



The documentation is not an afterthought.



It is the foundation upon which Bench is built.

