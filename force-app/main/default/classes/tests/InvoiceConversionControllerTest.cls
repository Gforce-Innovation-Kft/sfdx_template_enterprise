@IsTest
private class InvoiceConversionControllerTest {
  @TestSetup
  static void makeData() {
    InvoiceTestFactory.createInvoice(
      new Map<String, Object>{ 'Currency_ISO__c' => 'USD', 'Amount__c' => 100 }
    );
  }

  @IsTest
  static void convertInvoice_endToEnd_convertsAmount() {
    Invoice__c inv = [SELECT Id FROM Invoice__c LIMIT 1];
    Test.setMock(
      HttpCalloutMock.class,
      FxRatesHttpCalloutMock.success('EUR', 0.9, '2024-06-27')
    );

    Test.startTest();
    Invoice__c result = InvoiceConversionController.convertInvoice(inv.Id);
    Test.stopTest();

    System.assertEquals(
      'Converted',
      result.Status__c,
      'Invoice should be converted end to end'
    );
    System.assert(
      result.Amount_Base__c == 90,
      'Expected 100 * 0.9 = 90, got ' + result.Amount_Base__c
    );
  }

  @IsTest
  static void getInvoice_returnsRecord() {
    Invoice__c inv = [SELECT Id FROM Invoice__c LIMIT 1];

    Test.startTest();
    Invoice__c result = InvoiceConversionController.getInvoice(inv.Id);
    Test.stopTest();

    System.assertEquals(
      inv.Id,
      result.Id,
      'Should return the requested invoice'
    );
  }

  @IsTest
  static void convertInvoice_serviceError_throwsAuraHandled() {
    Invoice__c inv = [SELECT Id FROM Invoice__c LIMIT 1];

    fflib_ApexMocks mocks = new fflib_ApexMocks();
    IInvoiceConversionService serviceMock = (IInvoiceConversionService) mocks.mock(
      IInvoiceConversionService.class
    );
    mocks.startStubbing();
    ((IInvoiceConversionService) mocks.doThrowWhen(
        new InvoiceConversionServiceImpl.InvoiceConversionException('boom'),
        serviceMock
      ))
      .convert(new Set<Id>{ inv.Id });
    mocks.stopStubbing();
    Application.Service.setMock(IInvoiceConversionService.class, serviceMock);

    Test.startTest();
    try {
      InvoiceConversionController.convertInvoice(inv.Id);
      System.assert(false, 'Expected AuraHandledException');
    } catch (AuraHandledException e) {
      System.assert(true, 'AuraHandledException surfaced to the UI');
    }
    Test.stopTest();
  }
}
