## Change type

- [ ] Feature (REQ-**_: _**)
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
- [ ] All SOQL uses `WITH USER_MODE` (or `Security.stripInaccessible` where a partial result is wanted)
- [ ] All DML through Unit of Work
- [ ] No hardcoded IDs or credentials
- [ ] `with sharing` on all classes (or documented exception)
- [ ] `apiVersion: 67.0` on all meta files

## Security checklist

- [ ] FLS respected — selector queries run in user mode (`WITH USER_MODE`); the fflib default does NOT enforce FLS
- [ ] No new Named Credentials inline — using Named Credential framework
- [ ] No new sensitive fields without PII annotation in REQ YAML
