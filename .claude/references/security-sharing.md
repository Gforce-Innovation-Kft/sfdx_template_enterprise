# GForce Security & Sharing Model

---

## 1. Sharing Enforcement

Every class uses `with sharing` by default. `without sharing` requires an inline comment explaining why.

```apex
// Default — always
public with sharing class AccountServiceImpl implements IAccountService { }

// Justified exception — e.g., platform event handler that must run in system context
public without sharing class PlatformEventTriggerHandler {
    // without sharing: platform events fire in system context; no user context available
}

// Inherited sharing — use when class is called from both with/without sharing contexts
public inherited sharing class AccountSelector extends fflib_SObjectSelector { }
```

---

## 2. SOQL Security

**Every query must have `WITH SECURITY_ENFORCED` or go through `Security.stripInaccessible`.**

```apex
// Via fflib selector (preferred) — SECURITY_ENFORCED added automatically by fflib_QueryFactory
List<Account> accounts = selector.selectById(ids);

// Manual SOQL — add it explicitly
List<Account> accounts = [
    SELECT Id, Name, Industry
    FROM Account
    WHERE Id IN :ids
    WITH SECURITY_ENFORCED
];

// Dynamic SOQL or when stripInaccessible is needed (e.g., unknown field set)
SObjectAccessDecision decision = Security.stripInaccessible(
    AccessType.READABLE,
    [SELECT Id, Name, AnnualRevenue FROM Account WHERE Id IN :ids]
);
List<Account> safeAccounts = (List<Account>) decision.getRecords();
```

Never use `WITH USER_MODE` as a replacement — it only enforces sharing, not FLS.

---

## 3. DML Security

For DML in Apex (not through UoW), enforce CRUD using `AccessLevel.USER_MODE`:

```apex
// API 56+ (preferred)
Database.insert(records, AccessLevel.USER_MODE);
Database.update(records, AccessLevel.USER_MODE);
Database.delete(records, AccessLevel.USER_MODE);

// Or check permission explicitly before DML
if (!Schema.SObjectType.Account.isCreateable()) {
    throw new SecurityException('Insufficient permissions to create Account.');
}
insert accounts;
```

---

## 4. Field-Level Security (FLS)

Never bypass FLS. The selector's `WITH SECURITY_ENFORCED` handles read FLS.

For write FLS in service/domain:
```apex
// Check field-level writability before setting values
if (!Schema.SObjectType.Account.fields.AnnualRevenue.isUpdateable()) {
    throw new SecurityException('Cannot update AnnualRevenue — insufficient FLS.');
}
```

In LWC: use `lightning-record-form` or `lightning-record-edit-form` — they enforce FLS via UI API automatically.

---

## 5. Named Credentials (no hardcoded endpoints)

Never hardcode URLs, usernames, or credentials. Use Named Credentials for all external callouts.

```apex
// BAD
HttpRequest req = new HttpRequest();
req.setEndpoint('https://api.example.com/data');
req.setHeader('Authorization', 'Bearer abc123');

// GOOD
HttpRequest req = new HttpRequest();
req.setEndpoint('callout:ExternalCRM_NC/api/data');
// Authentication is handled by the Named Credential — no credentials in code
```

Named Credential naming convention: `{ExternalSystem}_NC` (e.g., `ExternalCRM_NC`, `PaymentGateway_NC`).

Store the Named Credential API name in Custom Metadata if it varies per environment:
```apex
// Custom Metadata: GForce_Integration__mdt with NC_Name__c field
GForce_Integration__mdt config = GForce_Integration__mdt.getInstance('ExternalCRM');
req.setEndpoint('callout:' + config.NC_Name__c + '/api/data');
```

---

## 6. Integration User

External integrations (inbound API, Connected Apps) must use a dedicated integration user:
- Profile: Minimum API-Only profile or custom minimum-access profile
- Permission Sets: Only the objects/fields the integration needs
- No sharing rules that expose unintended data
- Monitor via Login History and API Usage reports

Never use a named user account for integrations — it creates audit trail contamination and breaks when the user leaves.

---

## 7. Permission Sets (not Profiles)

Grant access via Permission Sets, not Profile customisations:
- One Permission Set per functional role (e.g., `GForce_AccountManager_PS`)
- Group into Permission Set Groups for assignment
- Test in a scratch org with a user assigned only the relevant PSG

```
GForce_AccountManager_PSG
  ├── GForce_AccountManager_PS   (object/field access)
  ├── GForce_ServiceCloud_PS     (case access)
  └── GForce_Reports_PS          (reports/dashboards)
```

---

## 8. No Hardcoded IDs

Never hardcode record IDs, RecordType IDs, Profile IDs, Role IDs, or any org-specific ID.

```apex
// BAD
Account acc = [SELECT Id FROM Account WHERE Id = '0015g000001abc' LIMIT 1];

// GOOD — query by external identifier
Account acc = [SELECT Id FROM Account WHERE External_Id__c = :externalId WITH SECURITY_ENFORCED LIMIT 1];

// BAD — hardcoded RecordType
acc.RecordTypeId = '0125g000000abc';

// GOOD — query by DeveloperName (portable across orgs)
Id rtId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Enterprise_Customer').getRecordTypeId();
acc.RecordTypeId = rtId;
```

---

## 9. CRUD Checks

For user-driven operations, verify CRUD before DML:

```apex
public static void assertCreateable(SObjectType sot) {
    if (!sot.getDescribe().isCreateable()) {
        throw new System.NoAccessException();
    }
}
```

Alternatively rely on `AccessLevel.USER_MODE` on DML statements (API 56+) which enforces CRUD automatically.

---

## 10. Org Security Checklist

Before deploying to production, verify:
- [ ] All Apex classes: `with sharing` or justified `without sharing`
- [ ] All SOQL: `WITH SECURITY_ENFORCED` or `Security.stripInaccessible`
- [ ] All DML via UoW or `AccessLevel.USER_MODE`
- [ ] No hardcoded IDs, URLs, or credentials
- [ ] Named Credentials used for all external callouts
- [ ] Integration user created with minimum-access profile + PSG
- [ ] Permission Sets cover all user access — no Profile customisations
- [ ] Session Settings: require MFA, set appropriate timeout
- [ ] Connected App: IP restrictions and OAuth scopes tightened
