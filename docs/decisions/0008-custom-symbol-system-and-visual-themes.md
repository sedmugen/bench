# 8. Custom Symbol System and Visual Theme Engine

Date: 2026-08-18

## Status

Accepted

## Context

Bench emphasizes a calm, glanceable terminal/TUI aesthetic. Standard iconography sets often introduce visual clutter or arbitrary visual styles. Furthermore, developers work across diverse lighting conditions requiring varied dark and light background luminance levels.

## Decision

1. Establish a canonical Greek symbol system for primary modules in `ModuleRegistry`:
   - Focus: `λ` (Lambda)
   - Capture: `κ` (Kappa)
   - Areas: `α` (Alpha)
   - Parking Lot: `π` (Pi)
   - Archive: `Ω` (Omega)
   - Jot: `ν` (Nu)
   - Log: `Σ` (Sigma)
   - Clips: `γ` (Gamma)
2. Support configurable iconography switching between Greek Bench Symbols and classic Lucide SVGs.
3. Provide a multi-level theme engine in `SettingsStore` ranging across 7 luminance levels (Deep Dark, Dark, Nord Dark, Neutral Dark, Sand Light, Neutral Light, Light) mapped via CSS custom properties.

## Consequences

- The interface retains a unique, high-signal, monospace-native visual identity.
- Users gain visual comfort across all lighting conditions without compromising flat TUI design tokens.
