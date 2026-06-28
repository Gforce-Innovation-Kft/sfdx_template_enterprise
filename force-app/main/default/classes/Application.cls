/**
 * Application factory — central registry for the fflib layers used by the
 * FX Invoice Conversion reference feature. Register every new SObject's
 * Service, Selector, Domain and UnitOfWork bindings here.
 */
public with sharing class Application {
  public static final fflib_Application.ServiceFactory Service = new fflib_Application.ServiceFactory(
    new Map<Type, Type>{
      IInvoiceConversionService.class => InvoiceConversionServiceImpl.class,
      IFxRatesGateway.class => FxRatesGatewayImpl.class
    }
  );

  public static final fflib_Application.SelectorFactory Selector = new fflib_Application.SelectorFactory(
    new Map<SObjectType, Type>{
      Invoice__c.SObjectType => InvoicesSelector.class
    }
  );

  public static final fflib_Application.DomainFactory Domain = new fflib_Application.DomainFactory(
    Application.Selector,
    new Map<SObjectType, Type>{
      Invoice__c.SObjectType => InvoicesDomain.Constructor.class
    }
  );

  // Order matters for DML: parents before children.
  public static final fflib_Application.UnitOfWorkFactory UnitOfWork = new fflib_Application.UnitOfWorkFactory(
    new List<SObjectType>{ Account.SObjectType, Invoice__c.SObjectType }
  );
}
