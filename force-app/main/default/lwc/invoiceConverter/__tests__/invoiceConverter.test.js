import { createElement } from "lwc";
import InvoiceConverter from "c/invoiceConverter";
import getInvoice from "@salesforce/apex/InvoiceConversionController.getInvoice";
import convertInvoice from "@salesforce/apex/InvoiceConversionController.convertInvoice";

jest.mock(
  "@salesforce/apex/InvoiceConversionController.getInvoice",
  () => {
    const { createApexTestWireAdapter } = require("@salesforce/sfdx-lwc-jest");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

// convertInvoice is called imperatively, so mock it explicitly.
jest.mock(
  "@salesforce/apex/InvoiceConversionController.convertInvoice",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const INVOICE = {
  Id: "a003000000000001AAA",
  Amount__c: 100,
  Currency_ISO__c: "USD",
  Amount_Base__c: 90,
  FX_Rate__c: 0.9,
  Rate_Date__c: "2024-06-27",
  Status__c: "Converted"
};

function flushPromises() {
  return Promise.resolve();
}

describe("c-invoice-converter", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  function createComponent() {
    const element = createElement("c-invoice-converter", {
      is: InvoiceConverter
    });
    element.recordId = INVOICE.Id;
    document.body.appendChild(element);
    return element;
  }

  it("shows a spinner before data arrives", () => {
    const element = createComponent();
    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();
  });

  it("renders invoice data when the wire emits a record", async () => {
    const element = createComponent();
    getInvoice.emit(INVOICE);
    await flushPromises();

    const badge = element.shadowRoot.querySelector("lightning-badge");
    expect(badge.label).toBe("Converted");
  });

  it("renders an error message when the wire errors", async () => {
    const element = createComponent();
    getInvoice.error({ message: "boom" });
    await flushPromises();

    const error = element.shadowRoot.querySelector(".slds-text-color_error");
    expect(error.textContent).toBe("boom");
  });

  it("calls the Apex convert method when the button is clicked", async () => {
    convertInvoice.mockResolvedValue(INVOICE);
    const element = createComponent();
    getInvoice.emit(INVOICE);
    await flushPromises();

    element.shadowRoot.querySelector("lightning-button").click();
    await flushPromises();

    expect(convertInvoice).toHaveBeenCalledWith({ recordId: INVOICE.Id });
  });
});
