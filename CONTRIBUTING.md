# Contributing to Bench

> Thank you for contributing to Bench.

Bench is intentionally small, opinionated, and documentation-driven. We
value thoughtful improvements over rapid feature growth.

------------------------------------------------------------------------

# Before You Start

Please read, in order:

1.  README.md
2.  docs/principles.md
3.  docs/terminology.md
4.  docs/prd.md
5.  docs/data-model.md
6.  Relevant ADRs

These documents define Bench. Code implements them.

------------------------------------------------------------------------

# Development Philosophy

Bench follows Documentation-Driven Development.

Idea → Discussion → Decision → Documentation → Implementation → Review

Do not implement undocumented features.

------------------------------------------------------------------------

# AI-Assisted Development

Bench embraces AI-assisted software engineering.

AI is welcome for implementation assistance.

AI is **not** the product owner.

Before submitting AI-generated code:

-   Read and understand it.
-   Verify it matches the documentation.
-   Remove unnecessary complexity.
-   Take responsibility for the final result.

------------------------------------------------------------------------

# Before You Code

Ask yourself:

-   Does this align with the Principles?
-   Does it pass the Bench Test?
-   Does it require an ADR?
-   Have I updated the documentation?
-   Is there a simpler solution?

------------------------------------------------------------------------

# Coding Standards

Follow `docs/code-style.md`.

Key expectations:

-   Small files
-   Single responsibility
-   Clear naming
-   Minimal dependencies
-   Readable code

------------------------------------------------------------------------

# Branching Strategy

Bench uses a structured branching workflow to maintain code quality and release stability:

- **`main`**: Protected release branch. Contains stable, thoroughly tested releases only. Direct commits to `main` are restricted.
- **`develop`**: Primary integration branch. Active development and feature merges happen here.

## Dedicated Work Branches

Create dedicated branches based on the scope of work:

- **Small fixes / mini-features**: `fix/<short-description>` or `patch/<short-description>`
- **Larger feature work**: `feature/<short-description>`
- **Maintenance & docs**: `chore/<short-description>` or `docs/<short-description>`

## Integration Flow

1. Branch off `develop`.
2. Implement, test, and document changes.
3. Open a Pull Request targeting `develop`.
4. Merge `develop` into `main` only for verified, stable release promotions.

------------------------------------------------------------------------

# Commit Messages

Bench uses Conventional Commits.

Examples:

-   feat:
-   fix:
-   docs:
-   refactor:
-   test:
-   chore:

------------------------------------------------------------------------

# Pull Requests

A good PR should:

-   Solve one problem
-   Include a clear description
-   Update documentation when required
-   Avoid unrelated changes

Small PRs are preferred.

------------------------------------------------------------------------

# Feature Requests

Before proposing a feature:

1.  Explain the problem.
2.  Explain why existing modules are insufficient.
3.  Explain how it aligns with the Principles.
4.  Explain how it reduces cognitive load.

Features that fail the Bench Test are unlikely to be accepted.

------------------------------------------------------------------------

# Architecture Decision Records

Significant architectural or product decisions require a new ADR.

Do not silently change documented behavior.

------------------------------------------------------------------------

# Reporting Bugs

Include:

-   Steps to reproduce
-   Expected behavior
-   Actual behavior
-   Environment
-   Screenshots (if relevant)

------------------------------------------------------------------------

# Code of Conduct

Be respectful.

Critique ideas, not people.

Assume good intent.

------------------------------------------------------------------------

# Golden Rule

Documentation defines Bench.

Code brings it to life.
