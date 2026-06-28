/**
 * Immutable value object representing a single FX rate result returned by
 * IFxRatesGateway: the rate (source -> base) and the date it applies to.
 */
public with sharing class FxRate {
  public final Decimal rate;
  public final Date rateDate;

  public FxRate(Decimal rate, Date rateDate) {
    this.rate = rate;
    this.rateDate = rateDate;
  }
}
