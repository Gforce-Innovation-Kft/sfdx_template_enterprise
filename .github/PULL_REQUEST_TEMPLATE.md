## Change type

- [ ] Feature (REQ-___: ___)
- [ ] Bug fix
- [ ] Refactor
- [ ] Chore / dependency update

## Description

<!-- What does this PR do and why? Link to REQ-NNN.yaml if applicable. -->

## Testing done

- [ ] Scratch org created and source pushed cleanly
- [ ] All Apex tests pass locally (`scripts/run-tests.sh <alias>`)
- [ ] Positive, negative, and bulk test scenarios covered
- [ ] Test coverage ≥ 85% on changed classes

## Definition of Done

- [ ] No `System.debug` in production code — NebulaLogger used
- [ ] No SOQL or DML in loops
- [ ] All SOQL uses `WITH SECURITY_ENFORCED` or `Security.stripInaccessible`
- [ ] All DML through Unit of Work
- [ ] No hardcoded IDs or credentials
- [ ] `with sharing` on all classes (or documented exception)
- [ ] `apiVersion: 67.0` on all meta files

## Security checklist

- [ ] FLS respected (selector queries + `WITH SECURITY_ENFORCED`)
- [ ] No new Named Credentials inline — using Named Credential framework
- [ ] No new sensitive fields without PII annotation in REQ YAML
