/**
 * LWC controller for the FX Invoice feature. Thin layer over the selector
 * (read) and the conversion service (callout + write). All errors are logged
 * and surfaced to the UI as AuraHandledException.
 */
public with sharing class InvoiceConversionController {
  @AuraEnabled(cacheable=true)
  public static Invoice__c getInvoice(Id recordId) {
    try {
      IInvoicesSelector selector = (IInvoicesSelector) Application.Selector.newInstance(
        Invoice__c.SObjectType
      );
      List<Invoice__c> invoices = selector.selectById(new Set<Id>{ recordId });
      return invoices.isEmpty() ? null : invoices[0];
    } catch (Exception e) {
      Logger.error('getInvoice failed', e)
        .addTag('InvoiceConversionController');
      Logger.saveLog();
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static Invoice__c convertInvoice(Id recordId) {
    try {
      IInvoiceConversionService service = (IInvoiceConversionService) Application.Service.newInstance(
        IInvoiceConversionService.class
      );
      service.convert(new Set<Id>{ recordId });

      IInvoicesSelector selector = (IInvoicesSelector) Application.Selector.newInstance(
        Invoice__c.SObjectType
      );
      List<Invoice__c> invoices = selector.selectById(new Set<Id>{ recordId });
      return invoices.isEmpty() ? null : invoices[0];
    } catch (Exception e) {
      Logger.error('convertInvoice failed', e)
        .addTag('InvoiceConversionController');
      Logger.saveLog();
      throw new AuraHandledException(e.getMessage());
    }
  }
}
