/**
 * Trigger handler for Invoice__c. Delegation only — routes the trigger to the
 * domain layer via the fflib trigger handler. No business logic here.
 */
public with sharing class InvoiceTriggerHandler {
  public static void run() {
    fflib_SObjectDomain.triggerHandler(InvoicesDomain.Constructor.class);
  }
}
