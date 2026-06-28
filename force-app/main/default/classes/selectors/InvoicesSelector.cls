/**
 * Selector for Invoice__c. All SOQL for the FX Invoice feature lives here.
 * fflib enforces FLS (WITH SECURITY_ENFORCED) on the generated queries.
 *
 * inherited sharing: the selector should run in the sharing context of its caller.
 */
public inherited sharing class InvoicesSelector extends fflib_SObjectSelector implements IInvoicesSelector {
  public static IInvoicesSelector newInstance() {
    return (IInvoicesSelector) Application.Selector.newInstance(
      Invoice__c.SObjectType
    );
  }

  public List<Schema.SObjectField> getSObjectFieldList() {
    return new List<Schema.SObjectField>{
      Invoice__c.Id,
      Invoice__c.Name,
      Invoice__c.Account__c,
      Invoice__c.Amount__c,
      Invoice__c.Currency_ISO__c,
      Invoice__c.Amount_Base__c,
      Invoice__c.FX_Rate__c,
      Invoice__c.Rate_Date__c,
      Invoice__c.Status__c
    };
  }

  public Schema.SObjectType getSObjectType() {
    return Invoice__c.SObjectType;
  }

  public List<Invoice__c> selectById(Set<Id> ids) {
    return (List<Invoice__c>) selectSObjectsById(ids);
  }

  public List<Invoice__c> selectDraftByAccount(Set<Id> accountIds) {
    fflib_QueryFactory qf = newQueryFactory();
    qf.setCondition('Account__c IN :accountIds AND Status__c = \'Draft\'');
    qf.addOrdering(Invoice__c.Name, fflib_QueryFactory.SortOrder.ASCENDING);
    return (List<Invoice__c>) Database.query(qf.toSOQL());
  }
}
