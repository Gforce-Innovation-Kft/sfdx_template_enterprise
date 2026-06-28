/**
 * Reusable HttpCalloutMock for the Frankfurter FX API used by gateway and
 * controller tests. Build a success response via success(...) or construct
 * directly with an arbitrary status code and body for error-path tests.
 */
@IsTest
public class FxRatesHttpCalloutMock implements HttpCalloutMock {
  private final Integer statusCode;
  private final String body;

  public FxRatesHttpCalloutMock(Integer statusCode, String body) {
    this.statusCode = statusCode;
    this.body = body;
  }

  public static FxRatesHttpCalloutMock success(
    String toCurrency,
    Decimal rate,
    String isoDate
  ) {
    String json =
      '{"amount":1.0,"base":"USD","date":"' +
      isoDate +
      '","rates":{"' +
      toCurrency +
      '":' +
      rate +
      '}}';
    return new FxRatesHttpCalloutMock(200, json);
  }

  public HttpResponse respond(HttpRequest req) {
    HttpResponse res = new HttpResponse();
    res.setStatusCode(statusCode);
    res.setStatus(statusCode == 200 ? 'OK' : 'Error');
    res.setHeader('Content-Type', 'application/json');
    res.setBody(body);
    return res;
  }
}
