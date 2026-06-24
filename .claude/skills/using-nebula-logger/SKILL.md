---
name: using-nebula-logger
description: How to use NebulaLogger in Apex — logging levels, Logger API, LogMessage, saveLog, exception handling, tagging, async contexts. Load when writing any Apex that needs Logger.*, logging, log entries, or NebulaLogger.
---

# NebulaLogger — Apex Usage Reference

Source: `libs/NebulaLogger/nebula-logger/core/main/logger-engine/classes/`
Never use `System.debug`. Always use `Logger.*` + `Logger.saveLog()`.

---

## 1. Basic pattern

```apex
Logger.info('AccountService: processing {0} accounts', new List<Object>{ accounts.size() });
// ... do work ...
Logger.saveLog();
```

`saveLog()` must be called explicitly — entries are buffered until then.
In triggers/service layers, call it once at the end of execution, not inside loops.

---

## 2. Logging levels

All levels return `LogEntryEventBuilder` for chaining. Use the level that matches severity:

| Method               | When to use                                              |
| -------------------- | -------------------------------------------------------- |
| `Logger.error(msg)`  | Unrecoverable failures, unexpected exceptions            |
| `Logger.warn(msg)`   | Recoverable issues, unexpected-but-handled states        |
| `Logger.info(msg)`   | Key business events (record created, integration called) |
| `Logger.debug(msg)`  | Developer context useful during development              |
| `Logger.fine(msg)`   | Step-level tracing                                       |
| `Logger.finer(msg)`  | Verbose tracing                                          |
| `Logger.finest(msg)` | Maximum verbosity                                        |

---

## 3. Message types

### Plain string

```apex
Logger.info('Processing started');
```

### Formatted string (LogMessage — preferred for dynamic values)

```apex
Logger.info(new LogMessage('Processing {0} of {1} records', processed, total));
// Up to 3 inline params, or pass List<Object>:
Logger.warn(new LogMessage('Skipped {0}: status={1}', new List<Object>{ acct.Name, acct.Status__c }));
```

`LogMessage` defers string formatting until the entry is actually saved — zero cost if the logging level is suppressed.

---

## 4. Attaching records and IDs

```apex
// Attach a single record ID
Logger.info('Account updated').setRecordId(acct.Id);

// Attach the full SObject (stores JSON snapshot)
Logger.info('Before update').setRecord(acct);

// Attach a list of records
Logger.warn('Partial failure').setRecord(failedRecords);
```

---

## 5. Exception handling

### Log and rethrow (preferred — saves immediately via EVENT_BUS then throws)

```apex
try {
    uow.commitWork();
} catch (Exception e) {
    Logger.exception('AccountService.save failed', e);  // logs ERROR, saves, throws
}
```

With a record:

```apex
Logger.exception('Failed to update account', acct, e);
Logger.exception('Failed to update account', acct.Id, e);
```

### Log without throwing

```apex
try {
    // ...
} catch (Exception e) {
    Logger.error('Non-fatal error in enrichment').setExceptionDetails(e);
    Logger.saveLog();
}
```

---

## 6. DML result logging

```apex
List<Database.SaveResult> results = Database.update(accounts, false);
for (Database.SaveResult r : results) {
    if (!r.isSuccess()) {
        Logger.error('DML failed for {0}', new List<Object>{ r.getId() })
              .setDatabaseResult(r);
    }
}
Logger.saveLog();
```

Accepts all DML result types: `SaveResult`, `DeleteResult`, `UpsertResult`, `MergeResult`, `UndeleteResult`, `LeadConvertResult`, `EmptyRecycleBinResult` — and their `List<>` variants.

---

## 7. Tagging entries

```apex
Logger.info('Integration callout sent')
      .addTag('GitHub')
      .addTag('Outbound');

// Or all at once
Logger.info('Batch started')
      .addTags(new List<String>{ 'BatchJob', 'NightlySync' });
```

Tags appear as `LogEntryTag__c` children and are filterable in the Logger app.

---

## 8. saveLog options

```apex
Logger.saveLog();                                          // default (EVENT_BUS)
Logger.saveLog(Logger.SaveMethod.EVENT_BUS);               // async via Platform Events (safest)
Logger.saveLog(Logger.SaveMethod.QUEUEABLE);               // async via Queueable — defers CPU/limits
Logger.saveLog(Logger.SaveMethod.REST);                    // sync callout via session ID — avoids mixed DML when other callouts exist
Logger.saveLog(Logger.SaveMethod.SYNCHRONOUS_DML);         // sync DML — avoid in triggers; rolls back on exception
```

`EVENT_BUS` is the default and recommended method. It decouples log writes from the current transaction — a DML rollback won't erase the log entry.

To change the default for the entire transaction (affects all subsequent `saveLog()` calls):

```apex
Logger.setSaveMethod(Logger.SaveMethod.QUEUEABLE);
// all subsequent Logger.saveLog() calls use QUEUEABLE
```

---

## 9. Scenarios (transaction-level tagging)

```apex
Logger.setScenario('AccountEnrichment');
Logger.info('Starting enrichment for {0} accounts', new List<Object>{ accounts.size() });
// All entries in this transaction are tagged with the scenario
Logger.saveLog();
```

---

## 10. Async contexts (Batch, Queueable, Schedulable)

Call this at the start of `execute()` to link log entries across async boundaries:

```apex
public void execute(Database.BatchableContext bc, List<Account> scope) {
    Logger.setAsyncContext(bc);
    Logger.info('Batch execute: processing {0} records', new List<Object>{ scope.size() });
    // ...
    Logger.saveLog();
}
```

Overloads: `setAsyncContext(QueueableContext)`, `setAsyncContext(SchedulableContext)`, `setAsyncContext(FinalizerContext)`.

### Chaining transactions (parent → child log link)

```apex
// In the parent (e.g. trigger or service):
String parentTxnId = Logger.getTransactionId();

// Pass parentTxnId to the child job, then in the child:
Logger.setParentLogTransactionId(parentTxnId);
```

---

## 11. Buffer control

```apex
Logger.getBufferSize();    // count of unsaved entries
Logger.flushBuffer();      // discard all unsaved entries
Logger.suspendSaving();    // ignore all saveLog() calls
Logger.resumeSaving();     // re-enable saving
```

---

## 12. Custom fields on LogEntryEvent\_\_e

Two scopes — transaction-wide (static) vs entry-specific (builder):

```apex
// Set on EVERY entry in this transaction
Logger.setField(LogEntryEvent__e.My_Custom_Field__c, 'shared value');

// Set on ONE specific entry only
Logger.warn('something happened')
      .setField(LogEntryEvent__e.My_Custom_Field__c, 'entry-specific value');

Logger.saveLog();
```

To persist the value to a `Log__c` or `LogEntry__c` custom field, create a `LoggerFieldMapping__mdt` record mapping the `LogEntryEvent__e` source field to the target object field.

---

## 13. LWC logging

```javascript
import { getLogger } from "c/logger";

export default class MyComponent extends LightningElement {
  logger = getLogger(); // one instance per component

  connectedCallback() {
    this.logger.setScenario("MyComponent:init");
    this.logger.info("Component initialized");
    this.logger.saveLog();
  }

  handleAction(event) {
    this.logger.finest("handleAction fired: " + JSON.stringify(event));
    try {
      // ... logic ...
      this.logger.info("Action succeeded").addTag("MyAction");
    } catch (err) {
      this.logger
        .error("Action failed")
        .setExceptionDetails(err)
        .addTag("MyAction");
    } finally {
      this.logger.saveLog();
    }
  }
}
```

All logging levels (`error`, `warn`, `info`, `debug`, `fine`, `finer`, `finest`), `.addTag()`, `.addTags()`, `.setExceptionDetails()`, `.setField()`, and `.saveLog()` are available in JS with identical semantics to Apex.

---

## 15. REST integration logging

```apex
@RestResource(urlMapping='/my-api/*')
global class MyRestResource {
  @HttpPost
  global static void doPost() {
    Logger.info('Inbound REST call').setRestRequestDetails(RestContext.request);
    // ...
    Logger.info('Response sent').setRestResponseDetails(RestContext.response);
    Logger.saveLog();
  }
}
```

---

## Hard rules

- **Never** `System.debug` — always `Logger.*`
- **Always** call `Logger.saveLog()` once per execution context (end of service method, end of batch execute, etc.)
- **Never** call `saveLog()` inside a loop
- Use `Logger.exception()` when you need to catch-log-rethrow — it saves before throwing
- Use `LogMessage` (not string concatenation) for messages with dynamic values
