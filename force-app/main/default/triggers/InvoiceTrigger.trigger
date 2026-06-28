/**
 * Invoice__c trigger — zero logic. One line to the handler.
 */
trigger InvoiceTrigger on Invoice__c(
  before insert,
  before update,
  after insert,
  after update
) {
  InvoiceTriggerHandler.run();
}
