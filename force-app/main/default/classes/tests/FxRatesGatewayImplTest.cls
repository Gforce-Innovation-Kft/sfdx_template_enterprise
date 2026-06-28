@IsTest
private class FxRatesGatewayImplTest {
  @IsTest
  static void getRate_returnsParsedRate() {
    Test.setMock(
      HttpCalloutMock.class,
      FxRatesHttpCalloutMock.success('EUR', 0.9321, '2024-06-27')
    );

    Test.startTest();
    FxRate result = new FxRatesGatewayImpl().getRate('USD', 'EUR');
    Test.stopTest();

    System.assert(
      result.rate == 0.9321,
      'Rate should be parsed from the response, got ' + result.rate
    );
    System.assertEquals(
      Date.newInstance(2024, 6, 27),
      result.rateDate,
      'Rate date should be parsed'
    );
  }

  @IsTest
  static void getRate_sameCurrency_skipsCallout() {
    // No HttpCalloutMock is set — a real callout would throw. The same-currency
    // short-circuit must avoid the callout entirely.
    Test.startTest();
    FxRate result = new FxRatesGatewayImpl().getRate('EUR', 'EUR');
    Test.stopTest();

    System.assert(
      result.rate == 1,
      'Same-currency conversion rate must be 1:1'
    );
  }

  @IsTest
  static void getRate_httpError_throws() {
    Test.setMock(
      HttpCalloutMock.class,
      new FxRatesHttpCalloutMock(500, 'server error')
    );

    Test.startTest();
    try {
      new FxRatesGatewayImpl().getRate('USD', 'EUR');
      System.assert(false, 'Expected FxGatewayException on HTTP 500');
    } catch (FxRatesGatewayImpl.FxGatewayException e) {
      System.assert(e.getMessage().contains('HTTP 500'), e.getMessage());
    }
    Test.stopTest();
  }

  @IsTest
  static void getRate_missingRate_throws() {
    Test.setMock(
      HttpCalloutMock.class,
      new FxRatesHttpCalloutMock(200, '{"date":"2024-06-27","rates":{}}')
    );

    Test.startTest();
    try {
      new FxRatesGatewayImpl().getRate('USD', 'EUR');
      System.assert(
        false,
        'Expected FxGatewayException when the rate is missing'
      );
    } catch (FxRatesGatewayImpl.FxGatewayException e) {
      System.assert(
        e.getMessage().contains('did not contain a rate'),
        e.getMessage()
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void getRate_blankInput_throws() {
    try {
      new FxRatesGatewayImpl().getRate('', 'EUR');
      System.assert(false, 'Expected FxGatewayException for blank input');
    } catch (FxRatesGatewayImpl.FxGatewayException e) {
      System.assert(e.getMessage().contains('required'), e.getMessage());
    }
  }
}
