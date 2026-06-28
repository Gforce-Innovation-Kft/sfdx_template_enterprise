/**
 * Project test-data wrapper for Invoice__c. Provides DML-backed builders (with
 * an auto-created Account parent) and an in-memory builder with fake Ids for
 * pure fflib unit tests that must not touch the database.
 */
@IsTest
public class InvoiceTestFactory {
  public static Invoice__c createInvoice(Map<String, Object> overrides) {
    return createInvoice(overrides, true);
  }

  public static Invoice__c createInvoice(
    Map<String, Object> overrides,
    Boolean doInsert
  ) {
    Map<String, Object> defaults = baseDefaults();
    defaults.put('Account__r.Name', 'Test Account');
    if (overrides != null) {
      defaults.putAll(overrides);
    }
    return (Invoice__c) TestDataFactory.createSObject(
      'Invoice__c',
      defaults,
      doInsert
    );
  }

  public static List<Invoice__c> createInvoices(
    Integer count,
    Map<String, Object> overrides,
    Boolean doInsert
  ) {
    Map<String, Object> defaults = baseDefaults();
    defaults.put('Account__r.Name', 'Test Account {!index}');
    if (overrides != null) {
      defaults.putAll(overrides);
    }
    return TestDataFactory.createSObjectList(
      'Invoice__c',
      defaults,
      count,
      doInsert
    );
  }

  /**
   * In-memory invoices with fake Ids and no relationships — for unit tests
   * that mock selectors/UoW and must avoid all DML.
   */
  public static List<Invoice__c> createInvoicesInMemory(
    Integer count,
    String currencyIso
  ) {
    List<Invoice__c> invoices = new List<Invoice__c>();
    for (Integer i = 0; i < count; i++) {
      invoices.add(
        new Invoice__c(
          Id = fflib_IDGenerator.generate(Invoice__c.SObjectType),
          Amount__c = 100,
          Currency_ISO__c = currencyIso,
          Status__c = 'Draft'
        )
      );
    }
    return invoices;
  }

  private static Map<String, Object> baseDefaults() {
    return new Map<String, Object>{
      'Amount__c' => 100,
      'Currency_ISO__c' => 'USD'
    };
  }
}
