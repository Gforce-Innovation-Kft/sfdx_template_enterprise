# Graph Report - sfdx_template_enterprise  (2026-07-08)

## Corpus Check
- 31 files · ~17,535 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 334 nodes · 349 edges · 31 communities (9 shown, 22 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c24b347`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 159|Community 159]]
- [[_COMMUNITY_Community 182|Community 182]]
- [[_COMMUNITY_Community 260|Community 260]]
- [[_COMMUNITY_Community 287|Community 287]]
- [[_COMMUNITY_Community 291|Community 291]]
- [[_COMMUNITY_Community 298|Community 298]]
- [[_COMMUNITY_Community 300|Community 300]]
- [[_COMMUNITY_Community 301|Community 301]]
- [[_COMMUNITY_Community 302|Community 302]]
- [[_COMMUNITY_Community 303|Community 303]]
- [[_COMMUNITY_Community 304|Community 304]]
- [[_COMMUNITY_Community 305|Community 305]]
- [[_COMMUNITY_Community 306|Community 306]]
- [[_COMMUNITY_Community 307|Community 307]]
- [[_COMMUNITY_Community 308|Community 308]]
- [[_COMMUNITY_Community 309|Community 309]]
- [[_COMMUNITY_Community 310|Community 310]]
- [[_COMMUNITY_Community 312|Community 312]]
- [[_COMMUNITY_Community 313|Community 313]]
- [[_COMMUNITY_Community 314|Community 314]]
- [[_COMMUNITY_Community 315|Community 315]]
- [[_COMMUNITY_Community 316|Community 316]]
- [[_COMMUNITY_Community 317|Community 317]]
- [[_COMMUNITY_Community 318|Community 318]]
- [[_COMMUNITY_Community 319|Community 319]]
- [[_COMMUNITY_Community 320|Community 320]]

## God Nodes (most connected - your core abstractions)
1. `TestDataFactory_Test` - 82 edges
2. `DefaultValueProvider` - 24 edges
3. `SObjectManager` - 12 edges
4. `TestDataFactory` - 10 edges
5. `Constructor` - 10 edges
6. `main()` - 10 edges
7. `InvoicesDomainTest` - 9 edges
8. `SObjectFactory` - 8 edges
9. `FxRatesGatewayImplTest` - 8 edges
10. `ListRelationshipFieldDefaultValue` - 7 edges

## Surprising Connections (you probably didn't know these)
- `DefaultValueProvider` --implements--> `IDefaultValueProvider`  [INFERRED]
  force-app/main/default/classes/TestDataFactory.cls → force-app/main/default/classes/TestDataFactory.cls  _Bridges community 287 → community 182_

## Import Cycles
- None detected.

## Communities (31 total, 22 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (6): auraConfig, { defineConfig }, eslintJs, globals, jestPlugin, lwcConfig

### Community 260 - "Community 260"
Cohesion: 0.08
Nodes (34): collectProjectInfo(), confirmTestDataFactory(), {
  CUSTOM_SKILLS,
  TEMPLATE_PACKAGE_NAME,
  _walkFiles
}, fs, path, read(), referencedSkills(), CUSTOM_SKILLS (+26 more)

### Community 287 - "Community 287"
Cohesion: 0.05
Nodes (16): AutoFieldDefaultValue, FieldDefaultValue, IDefaultValueProvider, IFieldDefaultValue, ISObjectFactory, ISObjectManager, ListFieldDefaultValue, ListRelationshipFieldDefaultValue (+8 more)

### Community 298 - "Community 298"
Cohesion: 0.15
Nodes (4): Constructor, InvoicesDomain, fflib_SObjectDomain, IInvoices

### Community 300 - "Community 300"
Cohesion: 0.20
Nodes (3): update, insert, InvoicesDomainTest

### Community 302 - "Community 302"
Cohesion: 0.25
Nodes (4): Exception, FxGatewayException, FxRatesGatewayImpl, IFxRatesGateway

### Community 303 - "Community 303"
Cohesion: 0.25
Nodes (4): Exception, IInvoiceConversionService, InvoiceConversionException, InvoiceConversionServiceImpl

### Community 304 - "Community 304"
Cohesion: 0.29
Nodes (3): fflib_SObjectSelector, IInvoicesSelector, InvoicesSelector

## Knowledge Gaps
- **44 isolated node(s):** `{ defineConfig }`, `eslintJs`, `jestPlugin`, `auraConfig`, `lwcConfig` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TestDataFactory_Test` connect `Community 56` to `Community 291`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `DefaultValueProvider` connect `Community 182` to `Community 287`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `SObjectManager` (e.g. with `ISObjectManager` and `merge`) actually correct?**
  _`SObjectManager` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ defineConfig }`, `eslintJs`, `jestPlugin` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 56` be split into smaller, more focused modules?**
  _Cohesion score 0.024390243902439025 - nodes in this community are weakly interconnected._
- **Should `Community 182` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Community 260` be split into smaller, more focused modules?**
  _Cohesion score 0.07505285412262157 - nodes in this community are weakly interconnected._