# Product Context — {{PROJECT_NAME}}

> **Instructions:** Replace every `{{REPLACE}}` section before writing feature code. This file is the source of truth for *what* the system does and *why*. AI assistants must read this file before generating any feature-level code.

---

## Business Goal

{{REPLACE: Describe the primary business problem this Salesforce implementation solves. What outcome does the client need? What does success look like in 12 months?}}

## Target Users and Personas

| Persona | Role | Primary Salesforce Cloud | Key Needs |
|---------|------|--------------------------|-----------|
| {{REPLACE}} | {{REPLACE}} | {{REPLACE}} | {{REPLACE}} |
| {{REPLACE}} | {{REPLACE}} | {{REPLACE}} | {{REPLACE}} |

## Salesforce Clouds in Scope

- [ ] Sales Cloud
- [ ] Service Cloud
- [ ] Experience Cloud
- [ ] Marketing Cloud
- [ ] Revenue Cloud
- [ ] Other: {{REPLACE}}

## Core Objects

| Object | Purpose | Custom or Standard |
|--------|---------|-------------------|
| {{REPLACE}} | {{REPLACE}} | {{REPLACE}} |

## Main Business Processes

1. {{REPLACE: Process name}} — {{REPLACE: brief description, entry point, and exit condition}}
2. {{REPLACE}}
3. {{REPLACE}}

## External Integrations

| System | Direction | Protocol | Auth Method |
|--------|-----------|----------|-------------|
| {{REPLACE}} | Inbound / Outbound | REST / SOAP / Event | {{REPLACE}} |

## Security Requirements

- Sharing model: {{REPLACE: Private / Read Only / Read Write}}
- Authentication: {{REPLACE: Standard Salesforce / SSO / External Identity}}
- Data classification: {{REPLACE: Public / Internal / Confidential / Restricted}}
- Regulatory requirements: {{REPLACE: GDPR / HIPAA / SOX / None}}
- Integration user strategy: {{REPLACE}}

## Reporting Needs

- {{REPLACE: Key reports and dashboards required}}
- Target audience: {{REPLACE}}
- Data freshness requirement: {{REPLACE: Real-time / Daily / Weekly}}

## Known Constraints

- Timeline: {{REPLACE}}
- Budget: {{REPLACE}}
- Existing system limitations: {{REPLACE}}
- Org edition: {{REPLACE: Enterprise / Unlimited / Developer}}
- Namespace: {{REPLACE: managed / unmanaged}}

## Acceptance Criteria (Project Level)

- [ ] {{REPLACE}}
- [ ] {{REPLACE}}
- [ ] {{REPLACE}}

---

*Last updated: {{REPLACE: YYYY-MM-DD}} by {{REPLACE: name}}*
