# 5. Areas Hierarchy and Workspace Inspector

Date: 2026-08-18

## Status

Accepted

## Context

The initial domain model (`docs/data-model.md`, ADR 0003) defined flat "Projects" as the sole container for tasks and knowledge. In practice, real-world responsibilities and creative endeavors naturally decompose into parent initiatives, sub-projects, and contextual areas (e.g. `Academics > CS > Compiler Design`). Additionally, managing these entities required a frictionless, glanceable workspace that avoids disruptive full-page view transitions.

## Decision

1. Evolve the first-class organizational entity into **Areas** supporting recursive multi-level hierarchy (`parentId`), cycle detection (`wouldCauseCycle`), and breadcrumb path rendering (`getAreaPathString`).
2. Centralize Area inspection, editing, and task assignment into the contextual, resizable right-hand **Inspector** panel rather than separate full-page views.
3. Provide safe cascading deletion semantics: deleting an Area allows reassignment of orphaned tasks and automatic reparenting of child areas (`deleteAreaForce`).

## Consequences

- Users can model nested initiatives while preserving rapid five-second glanceability.
- The UI retains a calm single-window layout without deeply nested navigation menus.
- The Domain model guarantees acyclic graph integrity for all parent-child relationships.
