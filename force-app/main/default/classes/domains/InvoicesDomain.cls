/**
 * Domain layer for Invoice__c — trigger-driven defaults, validation and rules.
 * No SOQL, no DML. Invoked via fflib_SObjectDomain.triggerHandler from the trigger.
 */
public inherited sharing class InvoicesDomain extends fflib_SObjectDomain implements IInvoices {
  public InvoicesDomain(List<Invoice__c> records) {
    super(records);
  }

  public class Constructor implements fflib_SObjectDomain.IConstructable {
    public fflib_SObjectDomain construct(List<SObject> records) {
      return new InvoicesDomain((List<Invoice__c>) records);
    }
  }

  public override void onApplyDefaults() {
    for (Invoice__c inv : (List<Invoice__c>) Records) {
      if (String.isBlank(inv.Status__c)) {
        inv.Status__c = 'Draft';
      }
      normalizeCurrency(inv);
    }
  }

  public override void onBeforeUpdate(Map<Id, SObject> existingRecords) {
    Map<Id, Invoice__c> oldMap = (Map<Id, Invoice__c>) existingRecords;
    for (Invoice__c inv : (List<Invoice__c>) Records) {
      normalizeCurrency(inv);
      Invoice__c old = oldMap.get(inv.Id);
      Boolean inputChanged =
        old != null &&
        (inv.Amount__c != old.Amount__c ||
        inv.Currency_ISO__c != old.Currency_ISO__c);
      if (inputChanged) {
        // Source amount/currency changed — previous conversion is stale.
        inv.Amount_Base__c = null;
        inv.FX_Rate__c = null;
        inv.Rate_Date__c = null;
        inv.Status__c = 'Draft';
      }
    }
  }

  public override void onValidate() {
    validate((List<Invoice__c>) Records);
  }

  public override void onValidate(Map<Id, SObject> existingRecords) {
    validate((List<Invoice__c>) Records);
  }

  public override void onAfterInsert() {
    Logger.info(
        new LogMessage(
          'InvoicesDomain.onAfterInsert: {0} invoice(s) created',
          Records.size()
        )
      )
      .addTag('InvoicesDomain');
    Logger.saveLog();
  }

  public override void onAfterUpdate(Map<Id, SObject> existingRecords) {
    Logger.info(
        new LogMessage(
          'InvoicesDomain.onAfterUpdate: {0} invoice(s) updated',
          Records.size()
        )
      )
      .addTag('InvoicesDomain');
    Logger.saveLog();
  }

  private void normalizeCurrency(Invoice__c inv) {
    if (String.isNotBlank(inv.Currency_ISO__c)) {
      inv.Currency_ISO__c = inv.Currency_ISO__c.toUpperCase();
    }
  }

  private void validate(List<Invoice__c> invoices) {
    for (Invoice__c inv : invoices) {
      if (inv.Amount__c == null || inv.Amount__c <= 0) {
        inv.addError('Invoice amount must be greater than zero.');
      }
      if (
        String.isBlank(inv.Currency_ISO__c) || inv.Currency_ISO__c.length() != 3
      ) {
        inv.addError('Currency (ISO) must be a 3-letter ISO 4217 code.');
      }
    }
  }
}
