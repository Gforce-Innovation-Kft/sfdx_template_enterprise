/**
 * Gateway abstraction over the external FX rate provider. Registered in
 * Application.Service so it can be mocked from service-layer unit tests.
 */
public interface IFxRatesGateway {
  /**
   * @param fromIso source currency ISO 4217 code
   * @param toIso   target (base) currency ISO 4217 code
   * @return the conversion rate and the date it applies to
   */
  FxRate getRate(String fromIso, String toIso);
}
