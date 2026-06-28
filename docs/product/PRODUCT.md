# Product Overview — FX Invoice Conversion (Reference Feature)

This template ships with one small, end-to-end reference feature that demonstrates
the GForce enterprise architecture. Use it as the worked example when building real
client features, then strip or replace it.

## What it does

Sales/finance users record an **Invoice** (`Invoice__c`, a child of `Account`) with an
amount in a source currency (e.g. `USD`, `GBP`, `JPY`). The system converts that amount
into a configurable **base currency** (default `EUR`) using live ECB reference rates from
the public, keyless **Frankfurter** FX API.

## Why

It exercises every layer of the documented stack in a way that is easy to read and reason
about:

```
Trigger → TriggerHandler → Domain → Selector → Service → UnitOfWork → Gateway → Logger
```

- **Custom object + relationship** — `Invoice__c` under standard `Account`
- **Trigger + Domain** — defaults `Status`, normalises the currency code, validates the
  amount/currency, and clears a stale conversion when the source amount changes
- **Selector** — all SOQL for invoices, FLS-enforced
- **Service + Unit of Work** — orchestrates read → callout → compute → batched DML, one
  callout per distinct currency pair, isolated per-invoice failure handling
- **Gateway** — HTTP integration to Frankfurter via a no-auth Named Credential; endpoint
  and base currency come from `FX_Setting__mdt` (no hardcoded values)
- **Controller + LWC** — `invoiceConverter` shows the invoice with a four-state template
  and a "Convert / Refresh Rate" button
- **NebulaLogger** — structured logging across domain, service and gateway
- **Tests** — TestDataFactory-based unit and integration tests, fflib mocks for the
  service layer, `HttpCalloutMock` for the callout

## Key components

| Layer       | Artifact                                                       |
| ----------- | -------------------------------------------------------------- |
| Object      | `Invoice__c`, `FX_Setting__mdt`                                |
| Trigger     | `InvoiceTrigger` → `InvoiceTriggerHandler`                     |
| Domain      | `InvoicesDomain` / `IInvoices`                                 |
| Selector    | `InvoicesSelector` / `IInvoicesSelector`                       |
| Service     | `InvoiceConversionServiceImpl` / `IInvoiceConversionService`   |
| Gateway     | `FxRatesGatewayImpl` / `IFxRatesGateway` / `FxRate`            |
| Controller  | `InvoiceConversionController`                                  |
| LWC         | `invoiceConverter`                                             |
| Integration | `Frankfurter` Named Credential → `https://api.frankfurter.app` |
| Security    | `FX_Invoice_Admin` permission set                              |

## Requirement

See `docs/product/requirements/REQ-001-fx-invoice-conversion.yaml`.
