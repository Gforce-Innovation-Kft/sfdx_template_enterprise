/**
 * Service interface for converting invoice amounts into the configured base
 * currency using live FX rates.
 */
public interface IInvoiceConversionService {
  void convert(Set<Id> invoiceIds);
}
