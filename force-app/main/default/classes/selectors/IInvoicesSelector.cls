/**
 * Selector interface for Invoice__c. SOQL access only — no business logic.
 */
public interface IInvoicesSelector extends fflib_ISObjectSelector {
  List<Invoice__c> selectById(Set<Id> ids);
  List<Invoice__c> selectDraftByAccount(Set<Id> accountIds);
}
