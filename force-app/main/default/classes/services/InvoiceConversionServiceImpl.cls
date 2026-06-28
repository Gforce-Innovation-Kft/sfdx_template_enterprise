/**
 * Orchestrates invoice currency conversion:
 *   Selector (read) -> FX Gateway (callout) -> compute -> Unit of Work (DML).
 *
 * Bulk-safe: at most one callout per distinct currency pair, all DML batched
 * into a single Unit of Work commit. Per-invoice failures are isolated and the
 * affected invoice is marked Failed rather than aborting the whole batch.
 */
public with sharing class InvoiceConversionServiceImpl implements IInvoiceConversionService {
  private static final String DEFAULT_BASE_CURRENCY = 'EUR';

  public void convert(Set<Id> invoiceIds) {
    if (invoiceIds == null || invoiceIds.isEmpty()) {
      return;
    }

    Logger.setScenario('InvoiceConversion');
    Logger.info(new LogMessage('Converting {0} invoice(s)', invoiceIds.size()))
      .addTag('InvoiceConversionService');

    String baseCurrency = resolveBaseCurrency();

    IInvoicesSelector selector = (IInvoicesSelector) Application.Selector.newInstance(
      Invoice__c.SObjectType
    );
    List<Invoice__c> invoices = selector.selectById(invoiceIds);

    IFxRatesGateway gateway = (IFxRatesGateway) Application.Service.newInstance(
      IFxRatesGateway.class
    );
    fflib_ISObjectUnitOfWork uow = Application.UnitOfWork.newInstance();

    Map<String, FxRate> ratesByPair = new Map<String, FxRate>();

    for (Invoice__c inv : invoices) {
      String pairKey = inv.Currency_ISO__c + '->' + baseCurrency;
      try {
        if (!ratesByPair.containsKey(pairKey)) {
          ratesByPair.put(
            pairKey,
            gateway.getRate(inv.Currency_ISO__c, baseCurrency)
          );
        }
        FxRate fx = ratesByPair.get(pairKey);
        inv.FX_Rate__c = fx.rate;
        inv.Rate_Date__c = fx.rateDate;
        inv.Amount_Base__c =
          (inv.Amount__c == null ? 0 : inv.Amount__c) * fx.rate;
        inv.Status__c = 'Converted';
      } catch (Exception e) {
        inv.Status__c = 'Failed';
        Logger.error(
            new LogMessage('Conversion failed for invoice {0}', inv.Id)
          )
          .setExceptionDetails(e)
          .setRecord(inv)
          .addTag('InvoiceConversionService');
      }
      uow.registerDirty(inv);
    }

    try {
      uow.commitWork();
      Logger.info(
          new LogMessage(
            'Committed conversion for {0} invoice(s)',
            invoices.size()
          )
        )
        .addTag('InvoiceConversionService');
    } catch (Exception e) {
      Logger.error('Failed to commit invoice conversions', e)
        .addTag('InvoiceConversionService');
      Logger.saveLog();
      throw new InvoiceConversionException(
        'Failed to commit invoice conversions: ' + e.getMessage(),
        e
      );
    }
    Logger.saveLog();
  }

  private String resolveBaseCurrency() {
    FX_Setting__mdt setting = FX_Setting__mdt.getInstance('Default');
    return (setting != null && String.isNotBlank(setting.Base_Currency_ISO__c))
      ? setting.Base_Currency_ISO__c.toUpperCase()
      : DEFAULT_BASE_CURRENCY;
  }

  public class InvoiceConversionException extends Exception {
  }
}
