---
name: new-requirement
description: Generate a GRS requirement YAML from a business description
version: 1.0.0
tags: [salesforce, requirements, grs, yaml]
---

# Skill: New Requirement YAML

Generate a well-formed GRS (GForce Requirement Spec) YAML file from a business description.

## Inputs required

Ask the user for:
- Business description of the requirement (free text)
- Jira epic key (if known)
- Priority: `low | medium | high | critical`
- Target Salesforce clouds / objects (if known)

## Process

1. Read `docs/product/requirements/_schema.yaml` to understand all fields
2. Read `docs/product/requirements/REQ-001-example.yaml` to see a complete example
3. Determine the next `REQ-NNN` number by listing files in `docs/product/requirements/`
4. Generate the YAML and save to `docs/product/requirements/REQ-NNN-{slug}.yaml`

## Output rules

- `id` format: `REQ-NNN` (zero-padded to 3 digits)
- `status`: always start as `draft`
- `acceptance_criteria`: at least 3 specific, testable criteria (Given/When/Then format preferred)
- `salesforce.objects`: use API names (e.g. `Account`, `Case`, not "Accounts")
- If information is unknown, use `"{{REPLACE}}"` as the value — never guess
- `security.sharing_model`: choose from `Private | Read Only | Read/Write | Controlled by Parent`
- After generating, tell the user which fields still need `{{REPLACE}}` filled in

## Schema reference

```yaml
id: REQ-NNN
title: string
jira_epic: string
jira_stories: [string]
status: draft | approved | implemented | tested
priority: low | medium | high | critical
business_goal: string
actors:
  - role: string
salesforce:
  objects: [string]
  processes: [string]
  clouds: [string]
acceptance_criteria: [string]
integrations: [string]
security:
  sharing_model: string
  permission_sets: [string]
notes: string
```
