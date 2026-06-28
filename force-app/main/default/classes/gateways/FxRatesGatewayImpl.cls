/**
 * HTTP gateway to the keyless public Frankfurter FX API (ECB reference rates).
 * Endpoint and base currency come from the Frankfurter Named Credential and
 * the FX_Setting__mdt custom metadata — no hardcoded URLs or secrets.
 */
public with sharing class FxRatesGatewayImpl implements IFxRatesGateway {
  private static final String NAMED_CREDENTIAL = 'callout:Frankfurter';
  private static final String DEFAULT_PATH = '/latest';
  private static final Integer TIMEOUT_MS = 10000;

  public FxRate getRate(String fromIso, String toIso) {
    if (String.isBlank(fromIso) || String.isBlank(toIso)) {
      throw new FxGatewayException(
        'Both source and target currency codes are required.'
      );
    }
    String fromCode = fromIso.toUpperCase();
    String toCode = toIso.toUpperCase();

    // Same currency needs no callout — the rate is always 1:1.
    if (fromCode == toCode) {
      return new FxRate(1, Date.today());
    }

    HttpRequest req = new HttpRequest();
    req.setMethod('GET');
    req.setEndpoint(
      NAMED_CREDENTIAL + resolvePath() + '?from=' + fromCode + '&to=' + toCode
    );
    req.setTimeout(TIMEOUT_MS);

    Logger.info(new LogMessage('FX rate callout {0} -> {1}', fromCode, toCode))
      .addTag('FxRatesGateway');

    try {
      HttpResponse res = new Http().send(req);
      if (res.getStatusCode() != 200) {
        Logger.error(
            new LogMessage(
              'FX provider returned HTTP {0} ({1})',
              res.getStatusCode(),
              res.getStatus()
            )
          )
          .addTag('FxRatesGateway');
        Logger.saveLog();
        throw new FxGatewayException(
          'FX provider returned HTTP ' + res.getStatusCode()
        );
      }
      return parse(res.getBody(), toCode);
    } catch (System.CalloutException e) {
      Logger.error('FX rate callout failed', e).addTag('FxRatesGateway');
      Logger.saveLog();
      throw new FxGatewayException(
        'FX rate callout failed: ' + e.getMessage(),
        e
      );
    }
  }

  private String resolvePath() {
    FX_Setting__mdt setting = FX_Setting__mdt.getInstance('Default');
    return (setting != null && String.isNotBlank(setting.Api_Path__c))
      ? setting.Api_Path__c
      : DEFAULT_PATH;
  }

  @SuppressWarnings('PMD.AvoidCatchingGenericException')
  private FxRate parse(String body, String toCode) {
    try {
      Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(
        body
      );
      Map<String, Object> rates = (Map<String, Object>) root.get('rates');
      if (rates == null || !rates.containsKey(toCode)) {
        throw new FxGatewayException(
          'FX provider response did not contain a rate for ' + toCode
        );
      }
      Decimal rate = Decimal.valueOf(String.valueOf(rates.get(toCode)));
      Date rateDate = Date.valueOf((String) root.get('date'));
      return new FxRate(rate, rateDate);
    } catch (FxGatewayException e) {
      throw e;
    } catch (Exception e) {
      Logger.error('Failed to parse FX provider response', e)
        .addTag('FxRatesGateway');
      Logger.saveLog();
      throw new FxGatewayException(
        'Failed to parse FX provider response: ' + e.getMessage(),
        e
      );
    }
  }

  public class FxGatewayException extends Exception {
  }
}
