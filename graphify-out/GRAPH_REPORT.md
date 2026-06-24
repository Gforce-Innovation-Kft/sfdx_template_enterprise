# Graph Report - /Users/demetergabor/gforce/sfdx_template_enterprise  (2026-06-24)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8 nodes · 6 edges · 2 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec6fa93c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]

## God Nodes (most connected - your core abstractions)
1. `{ defineConfig }` - 1 edges
2. `eslintJs` - 1 edges
3. `jestPlugin` - 1 edges
4. `auraConfig` - 1 edges
5. `lwcConfig` - 1 edges
6. `globals` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (2 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (6): auraConfig, { defineConfig }, eslintJs, globals, jestPlugin, lwcConfig

## Knowledge Gaps
- **6 isolated node(s):** `{ defineConfig }`, `eslintJs`, `jestPlugin`, `auraConfig`, `lwcConfig` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `{ defineConfig }`, `eslintJs`, `jestPlugin` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._