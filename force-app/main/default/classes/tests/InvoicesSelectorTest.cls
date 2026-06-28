@IsTest
private class InvoicesSelectorTest {
  @TestSetup
  static void makeData() {
    InvoiceTestFactory.createInvoices(3, null, true);
  }

  @IsTest
  static void selectById_returnsExpectedFields() {
    List<Invoice__c> all = [SELECT Id FROM Invoice__c];
    Set<Id> ids = new Map<Id, Invoice__c>(all).keySet();

    Test.startTest();
    List<Invoice__c> result = InvoicesSelector.newInstance().selectById(ids);
    Test.stopTest();

    System.assertEquals(3, result.size(), 'Should return all invoices by Id');
    System.assertNotEquals(
      null,
      result[0].Currency_ISO__c,
      'Currency field should be in the selector field list'
    );
    System.assertNotEquals(
      null,
      result[0].Status__c,
      'Status field should be in the selector field list'
    );
  }

  @IsTest
  static void selectDraftByAccount_filtersByAccountAndStatus() {
    Invoice__c seed = [SELECT Id, Account__c FROM Invoice__c LIMIT 1];
    Set<Id> accountIds = new Set<Id>{ seed.Account__c };

    Test.startTest();
    List<Invoice__c> result = InvoicesSelector.newInstance()
      .selectDraftByAccount(accountIds);
    Test.stopTest();

    System.assert(
      !result.isEmpty(),
      'Should return draft invoices for the account'
    );
    for (Invoice__c inv : result) {
      System.assertEquals(
        'Draft',
        inv.Status__c,
        'Only Draft invoices should be returned'
      );
      System.assertEquals(
        seed.Account__c,
        inv.Account__c,
        'Only the requested account should be returned'
      );
    }
  }
}
