@IsTest
private class InvoicesDomainTest {
  @IsTest
  static void insert_defaultsStatusAndUppercasesCurrency() {
    Invoice__c inv = InvoiceTestFactory.createInvoice(
      new Map<String, Object>{ 'Currency_ISO__c' => 'usd' }
    );

    Invoice__c saved = [
      SELECT Status__c, Currency_ISO__c
      FROM Invoice__c
      WHERE Id = :inv.Id
    ];
    System.assertEquals(
      'Draft',
      saved.Status__c,
      'Status should default to Draft on insert'
    );
    System.assertEquals(
      'USD',
      saved.Currency_ISO__c,
      'Currency should be upper-cased'
    );
  }

  @IsTest
  static void insert_invalidAmount_throws() {
    Invoice__c inv = InvoiceTestFactory.createInvoice(
      new Map<String, Object>{ 'Amount__c' => 0 },
      false
    );

    Test.startTest();
    try {
      insert inv;
      System.assert(false, 'Expected a validation error for a zero amount');
    } catch (DmlException e) {
      System.assert(
        e.getMessage().contains('greater than zero'),
        e.getMessage()
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void insert_invalidCurrency_throws() {
    Invoice__c inv = InvoiceTestFactory.createInvoice(
      new Map<String, Object>{ 'Currency_ISO__c' => 'US' },
      false
    );

    Test.startTest();
    try {
      insert inv;
      System.assert(
        false,
        'Expected a validation error for a bad currency code'
      );
    } catch (DmlException e) {
      System.assert(e.getMessage().contains('ISO 4217'), e.getMessage());
    }
    Test.stopTest();
  }

  @IsTest
  static void update_changingAmountResetsConversion() {
    Invoice__c inv = InvoiceTestFactory.createInvoice(null);

    // Simulate a prior conversion AND change the source amount in one update.
    inv.Amount__c = 250;
    inv.Amount_Base__c = 90;
    inv.FX_Rate__c = 0.9;
    inv.Status__c = 'Converted';
    update inv;

    Invoice__c saved = [
      SELECT Status__c, Amount_Base__c, FX_Rate__c, Rate_Date__c
      FROM Invoice__c
      WHERE Id = :inv.Id
    ];
    System.assertEquals(
      'Draft',
      saved.Status__c,
      'Status should reset to Draft when the amount changes'
    );
    System.assertEquals(
      null,
      saved.Amount_Base__c,
      'Base amount should be cleared'
    );
    System.assertEquals(null, saved.FX_Rate__c, 'Rate should be cleared');
  }

  @IsTest
  static void bulkInsert_200_allDraft() {
    List<Invoice__c> invoices = InvoiceTestFactory.createInvoices(
      200,
      null,
      true
    );

    System.assertEquals(
      200,
      invoices.size(),
      'Factory should create 200 invoices'
    );
    System.assertEquals(
      200,
      [SELECT COUNT() FROM Invoice__c WHERE Status__c = 'Draft'],
      'All bulk-inserted invoices should default to Draft'
    );
  }
}
