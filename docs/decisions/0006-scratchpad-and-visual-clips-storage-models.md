# 6. Scratchpad and Visual Clips Storage Models

Date: 2026-08-18

## Status

Accepted

## Context

Users frequently require two distinct modes of knowledge recording alongside structured tasks:
1. An instant, free-form scratchpad for quick markdown drafting, code snippets, and meeting notes (**Jot**).
2. A visual, color-coded card board for quick reference snippets, links, and tagged ideas (**Clips**).

Coupling these into the primary task item table would pollute task queries, risk schema bloat, and violate the single responsibility principle.

## Decision

1. Isolate the **Jot** scratchpad persistence into `JotStore` (`bench_jot`), providing lightweight markdown text persistence with automatic debounced saving.
2. Isolate visual card storage into `ClipsStore` (`bench_clips`), providing dedicated schema support for normalized tags (`normalizeTags`), color tagging (15 palette options), pinned cards, and masonry grid layouts.
3. Decouple lifecycle events via `EventBus`: when an Area is deleted, `ClipsStore` listens for `areaDeleted` to disassociate referenced IDs without tight cross-module coupling.

## Consequences

- Task queries remain ultra-fast, clean, and flat in `Repository`.
- Notes and clips maintain independent storage lifecycles while participating in global database resets and Area relationships.
