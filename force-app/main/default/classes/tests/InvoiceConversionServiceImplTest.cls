@IsTest
private class InvoiceConversionServiceImplTest {
  @IsTest
  static void convert_setsBaseAmountAndStatus() {
    fflib_ApexMocks mocks = new fflib_ApexMocks();
    IInvoicesSelector selectorMock = (IInvoicesSelector) mocks.mock(
      IInvoicesSelector.class
    );
    IFxRatesGateway gatewayMock = (IFxRatesGateway) mocks.mock(
      IFxRatesGateway.class
    );
    fflib_ISObjectUnitOfWork uowMock = (fflib_ISObjectUnitOfWork) mocks.mock(
      fflib_ISObjectUnitOfWork.class
    );

    List<Invoice__c> invoices = InvoiceTestFactory.createInvoicesInMemory(
      2,
      'USD'
    );
    Set<Id> ids = new Map<Id, Invoice__c>(invoices).keySet();

    mocks.startStubbing();
    mocks.when(selectorMock.sObjectType()).thenReturn(Invoice__c.SObjectType);
    mocks.when(selectorMock.selectById(ids)).thenReturn(invoices);
    mocks.when(gatewayMock.getRate('USD', 'EUR'))
      .thenReturn(new FxRate(0.9, Date.newInstance(2024, 6, 27)));
    mocks.stopStubbing();

    Application.Selector.setMock(selectorMock);
    Application.Service.setMock(IFxRatesGateway.class, gatewayMock);
    Application.UnitOfWork.setMock(uowMock);

    Test.startTest();
    ((IInvoiceConversionService) Application.Service.newInstance(
        IInvoiceConversionService.class
      ))
      .convert(ids);
    Test.stopTest();

    for (Invoice__c inv : invoices) {
      System.assertEquals(
        'Converted',
        inv.Status__c,
        'Status should be Converted'
      );
      System.assert(
        inv.Amount_Base__c == 90,
        'Expected 100 * 0.9 = 90, got ' + inv.Amount_Base__c
      );
      System.assert(
        inv.FX_Rate__c == 0.9,
        'Rate should be stored on the invoice'
      );
    }
    // Two invoices share one currency pair → exactly one callout.
    ((IFxRatesGateway) mocks.verify(gatewayMock, 1)).getRate('USD', 'EUR');
    ((fflib_ISObjectUnitOfWork) mocks.verify(uowMock, 2))
      .registerDirty(fflib_Match.anySObject());
    ((fflib_ISObjectUnitOfWork) mocks.verify(uowMock, 1)).commitWork();
  }

  @IsTest
  static void convert_gatewayFailure_marksFailed() {
    fflib_ApexMocks mocks = new fflib_ApexMocks();
    IInvoicesSelector selectorMock = (IInvoicesSelector) mocks.mock(
      IInvoicesSelector.class
    );
    IFxRatesGateway gatewayMock = (IFxRatesGateway) mocks.mock(
      IFxRatesGateway.class
    );
    fflib_ISObjectUnitOfWork uowMock = (fflib_ISObjectUnitOfWork) mocks.mock(
      fflib_ISObjectUnitOfWork.class
    );

    List<Invoice__c> invoices = InvoiceTestFactory.createInvoicesInMemory(
      1,
      'USD'
    );
    Set<Id> ids = new Map<Id, Invoice__c>(invoices).keySet();

    mocks.startStubbing();
    mocks.when(selectorMock.sObjectType()).thenReturn(Invoice__c.SObjectType);
    mocks.when(selectorMock.selectById(ids)).thenReturn(invoices);
    ((IFxRatesGateway) mocks.doThrowWhen(
        new FxRatesGatewayImpl.FxGatewayException('boom'),
        gatewayMock
      ))
      .getRate('USD', 'EUR');
    mocks.stopStubbing();

    Application.Selector.setMock(selectorMock);
    Application.Service.setMock(IFxRatesGateway.class, gatewayMock);
    Application.UnitOfWork.setMock(uowMock);

    Test.startTest();
    ((IInvoiceConversionService) Application.Service.newInstance(
        IInvoiceConversionService.class
      ))
      .convert(ids);
    Test.stopTest();

    System.assertEquals(
      'Failed',
      invoices[0].Status__c,
      'A failed conversion should mark the invoice Failed'
    );
    ((fflib_ISObjectUnitOfWork) mocks.verify(uowMock, 1)).commitWork();
  }

  @IsTest
  static void convert_emptyInput_isNoOp() {
    new InvoiceConversionServiceImpl().convert(new Set<Id>());
    System.assert(
      true,
      'Empty input should be handled gracefully without error'
    );
  }
}
